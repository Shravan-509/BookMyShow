import importlib.util
import sys
import types
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).with_name("show_scheduler.py")
sys.modules.setdefault("requests", types.SimpleNamespace(Session=lambda: None))
spec = importlib.util.spec_from_file_location("show_scheduler", MODULE_PATH)
show_scheduler = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = show_scheduler
spec.loader.exec_module(show_scheduler)


THEATRE_ID = "theatre-1"
THEATRE_TWO_ID = "theatre-2"
SCREEN_ID = "screen-1"
SCREEN_TWO_ID = "screen-2"
MOVIE_ID = "movie-1"


def theatre(overrides=None):
    return {
        "_id": THEATRE_ID,
        "name": "Sangam Theatre",
        "isActive": True,
        **(overrides or {}),
    }


def movie(overrides=None):
    return {
        "_id": MOVIE_ID,
        "movieName": "Dune",
        "releaseDate": "2025-01-01",
        **(overrides or {}),
    }


def screen(overrides=None):
    return {
        "_id": SCREEN_ID,
        "theatre": THEATRE_ID,
        "name": "Screen 1",
        "capacity": 150,
        "isActive": True,
        **(overrides or {}),
    }


def config(overrides=None):
    schedule = {
        "days_ahead": 1,
        "start_offset_days": 0,
        "max_same_movie_per_theatre_per_day": 4,
        "avoid_same_movie_consecutive_days": False,
        "default_ticket_price": 175,
        "default_total_seats": 200,
        "show_slots": [
            {"name": "Morning Show", "time": "10:30"},
        ],
        "screen_assignments": {},
        **((overrides or {}).get("schedule", {})),
    }

    return {
        "base_url": "http://localhost:3000/bms/v1",
        "request_timeout_seconds": 5,
        "authentication": {"enabled": False},
        "endpoints": {
            "login": "/auth/login",
            "movies": "/movies",
            "theatres": "/theatres",
            "shows_by_theatre": "/shows/theatre/{theatre_id}",
            "screens_by_theatre": "/theatres/{theatreId}/screens",
            "create_show": "/shows",
        },
        "schedule": schedule,
    }


def create_items(plan):
    return [item for item in plan if item.get("action") == "create"]


def skip_items(plan):
    return [item for item in plan if item.get("action") == "skip"]


class FakeResponse:
    def __init__(self, body, ok=True, status_code=200):
        self._body = body
        self.ok = ok
        self.status_code = status_code
        self.text = str(body)
        self.request = type("Request", (), {"method": "GET", "url": "http://test"})()

    def json(self):
        return self._body


class FakeSession:
    def __init__(self):
        self.last_get = None

    def get(self, url, params=None, timeout=None):
        self.last_get = {"url": url, "params": params, "timeout": timeout}
        return FakeResponse({"data": [screen()]})


class FakeApiClient:
    created_payloads = []

    def __init__(self, cfg):
        self.cfg = cfg

    def login(self):
        return None

    def get_movies(self):
        return [movie()]

    def get_theatres(self):
        return [theatre(), theatre({"_id": THEATRE_TWO_ID, "name": "No Screen Theatre"})]

    def get_all_shows(self, theatres):
        return []

    def get_screens_by_theatre(self, theatre_id):
        if theatre_id == THEATRE_ID:
            return [screen()]
        return []

    def create_show(self, payload):
        self.created_payloads.append(payload)
        return {"success": True}


class SchedulerScreenTests(unittest.TestCase):
    def test_zero_active_screens_skips_show(self):
        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [],
            config(),
            screens_by_theatre={THEATRE_ID: []},
        )

        self.assertEqual(len(create_items(plan)), 0)
        self.assertEqual(skip_items(plan)[0]["reason"], "NO_ACTIVE_SCREEN")

    def test_one_active_screen_is_selected_and_total_seats_absent(self):
        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [],
            config(),
            screens_by_theatre={THEATRE_ID: [screen()]},
        )

        payload = create_items(plan)[0]["payload"]
        self.assertEqual(payload["screen"], SCREEN_ID)
        self.assertEqual(payload["theatre"], THEATRE_ID)
        self.assertNotIn("totalSeats", payload)

    def test_multiplex_with_valid_assignment_selects_configured_screen(self):
        cfg = config({
            "schedule": {
                "screen_assignments": {
                    THEATRE_ID: {
                        "10:30": SCREEN_TWO_ID,
                    },
                },
            },
        })

        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [],
            cfg,
            screens_by_theatre={
                THEATRE_ID: [
                    screen(),
                    screen({"_id": SCREEN_TWO_ID, "name": "Screen 2", "capacity": 200}),
                ],
            },
        )

        self.assertEqual(create_items(plan)[0]["payload"]["screen"], SCREEN_TWO_ID)

    def test_multiplex_without_assignment_skips(self):
        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [],
            config(),
            screens_by_theatre={
                THEATRE_ID: [
                    screen(),
                    screen({"_id": SCREEN_TWO_ID, "name": "Screen 2", "capacity": 200}),
                ],
            },
        )

        self.assertEqual(skip_items(plan)[0]["reason"], "NO_SCREEN_ASSIGNMENT")

    def test_invalid_or_inactive_assignment_skips(self):
        cfg = config({
            "schedule": {
                "screen_assignments": {
                    THEATRE_ID: {
                        "10:30": "missing-screen",
                    },
                },
            },
        })

        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [],
            cfg,
            screens_by_theatre={
                THEATRE_ID: [
                    screen(),
                    screen({"_id": SCREEN_TWO_ID, "name": "Screen 2", "capacity": 200}),
                ],
            },
        )

        self.assertEqual(skip_items(plan)[0]["reason"], "INVALID_SCREEN_ASSIGNMENT")

    def test_screen_belonging_to_another_theatre_is_rejected(self):
        cfg = config({
            "schedule": {
                "screen_assignments": {
                    THEATRE_ID: {
                        "10:30": SCREEN_TWO_ID,
                    },
                },
            },
        })

        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [],
            cfg,
            screens_by_theatre={
                THEATRE_ID: [
                    screen(),
                    screen({
                        "_id": SCREEN_TWO_ID,
                        "theatre": THEATRE_TWO_ID,
                        "name": "Other Theatre Screen",
                        "capacity": 200,
                    }),
                ],
            },
        )

        self.assertEqual(skip_items(plan)[0]["reason"], "INVALID_SCREEN_ASSIGNMENT")

    def test_screen_api_failure_skips_theatre(self):
        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [],
            config(),
            screens_by_theatre={},
            screen_errors={THEATRE_ID: "HTTP 500"},
        )

        self.assertEqual(skip_items(plan)[0]["reason"], "SCREEN_API_ERROR")

    def test_dry_run_posts_no_shows(self):
        FakeApiClient.created_payloads = []
        with patch.object(show_scheduler, "ApiClient", FakeApiClient):
            result = show_scheduler.run(config(), apply=False, show_limit=None)

        self.assertEqual(result, 0)
        self.assertEqual(FakeApiClient.created_payloads, [])

    def test_apply_posts_only_valid_planned_shows(self):
        FakeApiClient.created_payloads = []
        with patch.object(show_scheduler, "ApiClient", FakeApiClient):
            result = show_scheduler.run(config(), apply=True, show_limit=None)

        self.assertEqual(result, 0)
        self.assertEqual(len(FakeApiClient.created_payloads), 1)
        self.assertEqual(FakeApiClient.created_payloads[0]["screen"], SCREEN_ID)
        self.assertNotIn("totalSeats", FakeApiClient.created_payloads[0])

    def test_screen_aware_duplicate_logic_allows_same_theatre_different_screen(self):
        today = datetime.now(timezone.utc).date().isoformat()
        cfg = config({
            "schedule": {
                "screen_assignments": {
                    THEATRE_ID: {
                        "10:30": SCREEN_TWO_ID,
                    },
                },
            },
        })
        existing_show = {
            "theatre": THEATRE_ID,
            "screen": SCREEN_ID,
            "date": today,
            "time": "10:30",
            "movie": MOVIE_ID,
        }

        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [existing_show],
            cfg,
            screens_by_theatre={
                THEATRE_ID: [
                    screen(),
                    screen({"_id": SCREEN_TWO_ID, "name": "Screen 2", "capacity": 200}),
                ],
            },
        )

        self.assertEqual(create_items(plan)[0]["payload"]["screen"], SCREEN_TWO_ID)

    def test_legacy_show_still_blocks_theatre_slot_conservatively(self):
        today = datetime.now(timezone.utc).date().isoformat()
        existing_show = {
            "theatre": THEATRE_ID,
            "date": today,
            "time": "10:30",
            "movie": MOVIE_ID,
        }

        plan = show_scheduler.build_plan(
            [movie()],
            [theatre()],
            [existing_show],
            config(),
            screens_by_theatre={THEATRE_ID: [screen()]},
        )

        self.assertEqual(skip_items(plan)[0]["reason"], "OCCUPIED")

    def test_get_screens_by_theatre_uses_active_screen_endpoint(self):
        session = FakeSession()
        with patch.object(show_scheduler.requests, "Session", lambda: session):
            client = show_scheduler.ApiClient(config())
            screens = client.get_screens_by_theatre(THEATRE_ID)

        self.assertEqual(screens[0]["_id"], SCREEN_ID)
        self.assertTrue(session.last_get["url"].endswith(f"/theatres/{THEATRE_ID}/screens"))
        self.assertEqual(session.last_get["params"], {"activeOnly": "true"})


if __name__ == "__main__":
    unittest.main()
