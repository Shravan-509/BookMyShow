#!/usr/bin/env python3
"""
BookMyShow rolling show scheduler.

Key properties:
- Fetches movies/theatres/shows from the BookMyShow API each run.
- Automatically includes newly added movies/theatres on later runs.
- Maintains a rolling future schedule window.
- Never schedules a movie before its release date.
- Avoids duplicate theatre/date/time slots.
- Supports dry-run mode (default).
- Does not delete historical shows by default.

Usage:
    python show_scheduler.py --config show_scheduler_config.json --dry-run
    python show_scheduler.py --config show_scheduler_config.json --apply
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

import requests
from collections import Counter, defaultdict


LOG = logging.getLogger("show_scheduler")


def unwrap_api_data(payload: Any) -> Any:
    """Accept plain arrays/objects and common {data: ...} API response envelopes."""
    if isinstance(payload, dict):
        for key in ("data", "result", "results"):
            if key in payload:
                return payload[key]
    return payload


def mongo_id(value: Any) -> str:
    """Extract MongoDB id from API strings or exported {$oid: ...} JSON."""
    if isinstance(value, dict) and "$oid" in value:
        return str(value["$oid"])
    if isinstance(value, dict) and "_id" in value:
        return mongo_id(value["_id"])
    return str(value)


def parse_mongo_date(value: Any) -> datetime | None:
    """Parse API ISO dates or Mongo export {$date: ...} dates."""
    if not value:
        return None
    if isinstance(value, dict) and "$date" in value:
        value = value["$date"]
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time(), tzinfo=timezone.utc)
    if isinstance(value, str):
        text = value.strip()
        try:
            if text.endswith("Z"):
                return datetime.fromisoformat(text[:-1] + "+00:00")
            return datetime.fromisoformat(text)
        except ValueError:
            try:
                return datetime.strptime(text[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                return None
    return None


def date_key(value: Any) -> str:
    parsed = parse_mongo_date(value)
    return parsed.date().isoformat() if parsed else str(value)[:10]

@dataclass(frozen=True)
class ShowSlot:
    name: str
    time: str


@dataclass(frozen=True)
class ScreenResolution:
    action: str
    reason: str | None = None
    screen: dict[str, Any] | None = None


class ApiClient:
    def __init__(self, config: dict[str, Any]):
        self.config = config
        self.base_url = config["base_url"].rstrip("/")
        self.endpoints = config["endpoints"]
        self.session = requests.Session()
        self.timeout = int(config.get("request_timeout_seconds", 30))

    def _url(self, endpoint_name: str, **kwargs: str) -> str:
        path = self.endpoints[endpoint_name].format(**kwargs)
        return f"{self.base_url}/{path.lstrip('/')}"

    def _json(self, response: requests.Response) -> Any:
        try:
            body = response.json()
        except ValueError as exc:
            raise RuntimeError(
                f"{response.request.method} {response.url} returned non-JSON "
                f"HTTP {response.status_code}: {response.text[:300]}"
            ) from exc

        if not response.ok:
            msg = body.get("message") if isinstance(body, dict) else str(body)
            raise RuntimeError(
                f"{response.request.method} {response.url} failed "
                f"HTTP {response.status_code}: {msg}"
            )
        return body

    def login(self) -> None:
        auth_cfg = self.config.get("authentication", {})
        if not auth_cfg.get("enabled", True):
            LOG.info("Authentication disabled by configuration.")
            return

        email = os.getenv(auth_cfg.get("email_env", "BMS_SCHEDULER_EMAIL"))
        password = os.getenv(auth_cfg.get("password_env", "BMS_SCHEDULER_PASSWORD"))

        if not email or not password:
            raise RuntimeError(
                "Scheduler credentials are missing. Set "
                f"{auth_cfg.get('email_env', 'BMS_SCHEDULER_EMAIL')} and "
                f"{auth_cfg.get('password_env', 'BMS_SCHEDULER_PASSWORD')}."
            )

        LOG.info("Scheduler login account: %s", email)

        payload = {
            auth_cfg.get("email_field", "email"): email,
            auth_cfg.get("password_field", "password"): password,
        }
        LOG.info("Authenticating scheduler account...")

        response = self.session.post(
            self._url("login"),
            json=payload,
            timeout=self.timeout,
        )
        body = self._json(response)

        LOG.info(
            "Login response keys: %s",
            list(body.keys())
            if isinstance(body, dict)
            else type(body).__name__
        )

        message = (
            body.get("message", "")
            if isinstance(body, dict)
            else ""
        )

        # Detect 2FA requirement
        requires_2fa = (
            isinstance(body, dict)
            and (
                body.get("requires2FA")
                or body.get("requires2fa")
                or body.get("twoFactorRequired")
                or "2fa" in message.lower()
                or "verification code" in message.lower()
            )
        )

        if requires_2fa:
            LOG.info("2FA verification required.")

            code = input("Enter the 2FA code sent to your email: ").strip()

            if not code:
                raise RuntimeError("2FA code is required.")

            verify_payload = {
                "email": email,
                "code": code,
            }

            verify_response = self.session.post(
                self._url("verify_2fa"),
                json=verify_payload,
                timeout=self.timeout,
            )

            body = self._json(verify_response)
            LOG.info("2FA verification successful.")

        # Cookie-based auth works automatically through requests.Session.
        # Optional token-based APIs are supported too.
        token_path = auth_cfg.get("token_response_field")
        if token_path and isinstance(body, dict):
            token = body
            for part in token_path.split("."):
                token = token.get(part) if isinstance(token, dict) else None
            if token:
                header = auth_cfg.get("token_header", "Authorization")
                prefix = auth_cfg.get("token_prefix", "Bearer ")
                self.session.headers[header] = f"{prefix}{token}"

        LOG.info("Authentication successful.")

    def get_movies(self) -> list[dict[str, Any]]:
        response = self.session.get(self._url("movies"), timeout=self.timeout)
        data = unwrap_api_data(self._json(response))
        if not isinstance(data, list):
            raise RuntimeError("Movies endpoint did not return a list.")
        return data

    def get_theatres(self) -> list[dict[str, Any]]:
        response = self.session.get(self._url("theatres"), timeout=self.timeout)
        data = unwrap_api_data(self._json(response))
        if not isinstance(data, list):
            raise RuntimeError("Theatres endpoint did not return a list.")
        return data

    def get_shows_by_theatre(self, theatre_id: str) -> list[dict[str, Any]]:
        response = self.session.get(
            self._url("shows_by_theatre", theatre_id=theatre_id),
            timeout=self.timeout,
        )

        data = unwrap_api_data(self._json(response))

        if not isinstance(data, list):
            raise RuntimeError(
                f"Shows endpoint for theatre {theatre_id} did not return a list."
            )

        return data

    def get_screens_by_theatre(
        self,
        theatre_id: str,
        active_only: bool = True,
    ) -> list[dict[str, Any]]:
        response = self.session.get(
            self._url("screens_by_theatre", theatreId=theatre_id),
            params={"activeOnly": "true"} if active_only else None,
            timeout=self.timeout,
        )

        data = unwrap_api_data(self._json(response))

        if not isinstance(data, list):
            raise RuntimeError(
                f"Screens endpoint for theatre {theatre_id} did not return a list."
            )

        return data

    def get_all_shows(self, theatres: list[dict[str, Any]]) -> list[dict[str, Any]]:
        all_shows = []

        for theatre in theatres:
            theatre_id = mongo_id(theatre.get("_id"))

            if not theatre_id:
                continue

            LOG.info(
                "Fetching shows for theatre: %s",
                theatre.get("name", theatre_id),
            )

            shows = self.get_shows_by_theatre(theatre_id)
            all_shows.extend(shows)

        return all_shows

    def create_show(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.session.post(
            self._url("create_show"),
            json=payload,
            timeout=self.timeout,
        )
        return self._json(response)


def load_json(path: str | Path) -> Any:
    with Path(path).open("r", encoding="utf-8") as fh:
        return json.load(fh)


def load_config(path: str | Path) -> dict[str, Any]:
    cfg = load_json(path)
    required = ("base_url", "endpoints", "schedule")
    missing = [key for key in required if key not in cfg]
    if missing:
        raise ValueError(f"Config missing required keys: {', '.join(missing)}")
    return cfg


def active_theatres(theatres: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    return [t for t in theatres if t.get("isActive", True)]


def eligible_movies(
    movies: Iterable[dict[str, Any]],
    show_date: date,
    max_catalog_age_days: int | None,
) -> list[dict[str, Any]]:
    result = []
    for movie in movies:
        released = parse_mongo_date(movie.get("releaseDate"))
        if released and released.date() > show_date:
            continue

        if max_catalog_age_days and released:
            age = (show_date - released.date()).days
            if age > max_catalog_age_days:
                continue

        result.append(movie)
    return result


def movie_weight(movie: dict[str, Any], show_date: date, cfg: dict[str, Any]) -> int:
    released = parse_mongo_date(movie.get("releaseDate"))
    if not released:
        return 1

    age = max(0, (show_date - released.date()).days)
    recent_days = int(cfg.get("recent_release_days", 60))
    medium_days = int(cfg.get("medium_release_days", 180))

    if age <= recent_days:
        return int(cfg.get("recent_weight", 5))
    if age <= medium_days:
        return int(cfg.get("medium_weight", 3))
    return int(cfg.get("catalog_weight", 1))


def weighted_rotation(
    movies: list[dict[str, Any]],
    show_date: date,
    count: int,
    cfg: dict[str, Any],
    seed: str,
) -> list[dict[str, Any]]:
    """
    Return a deterministic weighted daily selection.
    Deterministic seeding means a rerun for the same day/theatre set produces
    the same choices unless the movie catalogue changes.
    """
    if not movies or count <= 0:
        return []

    rng = random.Random(seed)
    available = list(movies)
    chosen: list[dict[str, Any]] = []

    while available and len(chosen) < count:
        weights = [max(1, movie_weight(m, show_date, cfg)) for m in available]
        selected = rng.choices(available, weights=weights, k=1)[0]
        chosen.append(selected)
        available.remove(selected)

    # More theatres than movies: continue in deterministic order.
    if len(chosen) < count:
        ordered = sorted(movies, key=lambda m: (m.get("movieName", ""), mongo_id(m.get("_id"))))
        idx = 0
        while len(chosen) < count:
            chosen.append(ordered[idx % len(ordered)])
            idx += 1

    return chosen


def optional_mongo_id(value: Any) -> str | None:
    if value is None or value == "":
        return None
    return mongo_id(value)


def screen_belongs_to_theatre(screen: dict[str, Any], theatre_id: str) -> bool:
    return optional_mongo_id(screen.get("theatre")) == theatre_id


def screen_assignment_for_slot(
    theatre: dict[str, Any],
    slot: ShowSlot,
    config: dict[str, Any],
) -> str | None:
    schedule_cfg = config["schedule"]
    assignments = schedule_cfg.get("screen_assignments", {})
    theatre_id = mongo_id(theatre.get("_id"))
    theatre_name = str(theatre.get("name", ""))
    theatre_assignments = assignments.get(theatre_id) or assignments.get(theatre_name) or {}
    return theatre_assignments.get(slot.time) or theatre_assignments.get(slot.name)


def resolve_screen_for_slot(
    theatre: dict[str, Any],
    screens: list[dict[str, Any]],
    slot: ShowSlot,
    config: dict[str, Any],
) -> ScreenResolution:
    theatre_id = mongo_id(theatre.get("_id"))
    active_screens = [
        screen
        for screen in screens
        if screen.get("isActive", True)
    ]

    if not active_screens:
        return ScreenResolution(action="skip", reason="NO_ACTIVE_SCREEN")

    if len(active_screens) == 1:
        if not screen_belongs_to_theatre(active_screens[0], theatre_id):
            return ScreenResolution(action="skip", reason="INVALID_SCREEN_ASSIGNMENT")
        return ScreenResolution(action="create", screen=active_screens[0])

    configured_screen_id = screen_assignment_for_slot(theatre, slot, config)
    if not configured_screen_id:
        return ScreenResolution(action="skip", reason="NO_SCREEN_ASSIGNMENT")

    configured_screen_id = mongo_id(configured_screen_id)
    matched = next(
        (
            screen
            for screen in active_screens
            if mongo_id(screen.get("_id")) == configured_screen_id
        ),
        None,
    )

    if not matched:
        return ScreenResolution(action="skip", reason="INVALID_SCREEN_ASSIGNMENT")

    if not screen_belongs_to_theatre(matched, theatre_id):
        return ScreenResolution(action="skip", reason="INVALID_SCREEN_ASSIGNMENT")

    return ScreenResolution(action="create", screen=matched)


def existing_slot_keys(
    shows: Iterable[dict[str, Any]]
) -> tuple[set[tuple[str, str, str]], set[tuple[str, str, str]]]:
    """
    Screen-aware shows occupy screen + date + time. Legacy shows without a
    screen still conservatively occupy theatre + date + time.
    """
    legacy_theatre_keys: set[tuple[str, str, str]] = set()
    screen_keys: set[tuple[str, str, str]] = set()
    for show in shows:
        theatre = mongo_id(show.get("theatre"))
        day = date_key(show.get("date"))
        time = str(show.get("time", "")).strip()
        screen = optional_mongo_id(show.get("screen"))
        if theatre and day and time:
            if screen:
                screen_keys.add((screen, day, time))
            else:
                legacy_theatre_keys.add((theatre, day, time))
    return legacy_theatre_keys, screen_keys

# ============================================================
# NEW: Existing movie assignments
# ============================================================

def existing_movie_assignments(
    shows: list[dict[str, Any]]
) -> dict[tuple[str, str], Counter]:

    assignments = defaultdict(Counter)

    for show in shows:
        theatre_id = mongo_id(
            show.get("theatre")
        )

        movie_id = mongo_id(
            show.get("movie")
        )

        show_day = date_key(
            show.get("date")
        )

        if theatre_id and movie_id and show_day:
            assignments[
                (theatre_id, show_day)
            ][movie_id] += 1

    return assignments


# ============================================================
# NEW: Select movie for individual show slot
# ============================================================

def choose_movie_for_slot(
    movies: list[dict[str, Any]],
    show_date: date,
    theatre_id: str,
    today_counts: Counter,
    previous_day_movies: set[str],
    schedule_cfg: dict[str, Any],
    rng: random.Random,
) -> dict[str, Any]:

    max_per_day = int(
        schedule_cfg.get(
            "max_same_movie_per_theatre_per_day",
            2
        )
    )

    avoid_previous_day = bool(
        schedule_cfg.get(
            "avoid_same_movie_consecutive_days",
            True
        )
    )

    candidates = [
        movie
        for movie in movies
        if today_counts[
            mongo_id(movie["_id"])
        ] < max_per_day
    ]

    if not candidates:
        candidates = list(movies)

    if avoid_previous_day:
        non_repeating = [
            movie
            for movie in candidates
            if mongo_id(movie["_id"])
            not in previous_day_movies
        ]

        if non_repeating:
            candidates = non_repeating

    weights = [
        max(
            1,
            movie_weight(
                movie,
                show_date,
                schedule_cfg
            )
        )
        for movie in candidates
    ]

    return rng.choices(
        candidates,
        weights=weights,
        k=1
    )[0]


def infer_theatre_defaults(
    theatres: list[dict[str, Any]],
    shows: list[dict[str, Any]],
    config: dict[str, Any],
) -> dict[str, dict[str, int]]:
    """
    Build per-theatre ticketPrice / totalSeats defaults.
    Preference order:
      1. config.schedule.theatre_defaults[theatre_id or theatre_name]
      2. most recently observed show for the theatre
      3. global defaults
    """
    schedule_cfg = config["schedule"]
    global_price = int(schedule_cfg.get("default_ticket_price", 175))
    global_seats = int(schedule_cfg.get("default_total_seats", 200))
    configured = schedule_cfg.get("theatre_defaults", {})

    recent_by_theatre: dict[str, tuple[datetime, dict[str, Any]]] = {}
    for show in shows:
        tid = mongo_id(show.get("theatre"))
        updated = parse_mongo_date(show.get("updatedAt")) or parse_mongo_date(show.get("createdAt"))
        updated = updated or datetime.min.replace(tzinfo=timezone.utc)
        current = recent_by_theatre.get(tid)
        if not current or updated > current[0]:
            recent_by_theatre[tid] = (updated, show)

    result: dict[str, dict[str, int]] = {}
    for theatre in theatres:
        tid = mongo_id(theatre.get("_id"))
        name = str(theatre.get("name", ""))
        override = configured.get(tid) or configured.get(name)

        if override:
            result[tid] = {
                "ticketPrice": int(override.get("ticketPrice", global_price)),
                "totalSeats": int(override.get("totalSeats", global_seats)),
            }
            continue

        previous = recent_by_theatre.get(tid)
        if previous:
            show = previous[1]
            result[tid] = {
                "ticketPrice": int(show.get("ticketPrice", global_price)),
                "totalSeats": int(show.get("totalSeats", global_seats)),
            }
        else:
            result[tid] = {
                "ticketPrice": global_price,
                "totalSeats": global_seats,
            }

    return result


def build_plan(
    movies: list[dict[str, Any]],
    theatres: list[dict[str, Any]],
    shows: list[dict[str, Any]],
    config: dict[str, Any],
    screens_by_theatre: dict[str, list[dict[str, Any]]] | None = None,
    screen_errors: dict[str, str] | None = None,
) -> list[dict[str, Any]]:

    schedule_cfg = config["schedule"]

    days_ahead = int(
        schedule_cfg.get(
            "days_ahead",
            7
        )
    )

    start_offset = int(
        schedule_cfg.get(
            "start_offset_days",
            0
        )
    )

    max_age = schedule_cfg.get(
        "max_catalog_age_days"
    )

    max_age = (
        int(max_age)
        if max_age
        else None
    )

    slots = [
        ShowSlot(
            name=item["name"],
            time=item["time"]
        )
        for item
        in schedule_cfg["show_slots"]
    ]

    theatres = sorted(
        active_theatres(theatres),
        key=lambda theatre: (
            str(
                theatre.get(
                    "name",
                    ""
                )
            ),
            mongo_id(
                theatre.get("_id")
            ),
        ),
    )

    legacy_theatre_slots, occupied_screen_slots = existing_slot_keys(
        shows
    )

    existing_assignments = (
        existing_movie_assignments(
            shows
        )
    )

    defaults = infer_theatre_defaults(
        theatres,
        shows,
        config
    )

    today = datetime.now().date()

    planned: list[
        dict[str, Any]
    ] = []
    screens_by_theatre = screens_by_theatre or {}
    screen_errors = screen_errors or {}

    for offset in range(
        start_offset,
        start_offset + days_ahead
    ):

        target_date = (
            today
            + timedelta(
                days=offset
            )
        )

        eligible = eligible_movies(
            movies,
            target_date,
            max_age
        )

        if not eligible:
            LOG.warning(
                "No eligible movies for %s",
                target_date
            )
            continue

        for theatre in theatres:

            theatre_id = mongo_id(
                theatre["_id"]
            )

            theatre_name = theatre.get(
                "name",
                theatre_id
            )

            theatre_default = defaults[
                theatre_id
            ]

            today_key = (
                theatre_id,
                target_date.isoformat()
            )

            previous_day = (
                target_date
                - timedelta(days=1)
            )

            previous_key = (
                theatre_id,
                previous_day.isoformat()
            )

            # Start from anything already scheduled
            # in the database for this theatre/day.
            today_counts = Counter(
                existing_assignments.get(
                    today_key,
                    {}
                )
            )

            previous_day_movies = set(
                existing_assignments.get(
                    previous_key,
                    {}
                ).keys()
            )

            # Also consider shows planned earlier
            # in this same scheduler execution.
            rng = random.Random(
                f"{target_date.isoformat()}"
                f"|{theatre_id}"
                f"|{','.join(sorted(mongo_id(m['_id']) for m in eligible))}"
            )

            for slot in slots:

                slot_key = (
                    theatre_id,
                    target_date.isoformat(),
                    slot.time
                )

                if theatre_id in screen_errors:
                    planned.append(
                        {
                            "action": "skip",
                            "reason": "SCREEN_API_ERROR",
                            "theatreName": theatre_name,
                            "theatreId": theatre_id,
                            "date": target_date.isoformat(),
                            "time": slot.time,
                            "showName": slot.name,
                            "error": screen_errors[theatre_id],
                        }
                    )
                    continue

                # Legacy Theatre-only shows occupy the Theatre slot
                # conservatively because their Screen is unknown.
                if slot_key in legacy_theatre_slots:
                    planned.append(
                        {
                            "action": "skip",
                            "reason": "OCCUPIED",
                            "theatreName": theatre_name,
                            "theatreId": theatre_id,
                            "date": target_date.isoformat(),
                            "time": slot.time,
                            "showName": slot.name,
                        }
                    )
                    continue

                screen_resolution = resolve_screen_for_slot(
                    theatre,
                    screens_by_theatre.get(theatre_id, []),
                    slot,
                    config,
                )

                if screen_resolution.action != "create":
                    planned.append(
                        {
                            "action": "skip",
                            "reason": screen_resolution.reason,
                            "theatreName": theatre_name,
                            "theatreId": theatre_id,
                            "date": target_date.isoformat(),
                            "time": slot.time,
                            "showName": slot.name,
                        }
                    )
                    continue

                screen = screen_resolution.screen
                screen_id = mongo_id(screen.get("_id"))
                screen_slot_key = (
                    screen_id,
                    target_date.isoformat(),
                    slot.time
                )

                if screen_slot_key in occupied_screen_slots:
                    planned.append(
                        {
                            "action": "skip",
                            "reason": "OCCUPIED",
                            "theatreName": theatre_name,
                            "theatreId": theatre_id,
                            "screenName": screen.get("name", screen_id),
                            "screenId": screen_id,
                            "date": target_date.isoformat(),
                            "time": slot.time,
                            "showName": slot.name,
                        }
                    )
                    continue

                movie = choose_movie_for_slot(
                    movies=eligible,
                    show_date=target_date,
                    theatre_id=theatre_id,
                    today_counts=today_counts,
                    previous_day_movies=previous_day_movies,
                    schedule_cfg=schedule_cfg,
                    rng=rng,
                )

                movie_id = mongo_id(
                    movie["_id"]
                )

                payload = {
                    "name": slot.name,
                    "date": (
                        target_date
                        .isoformat()
                    ),
                    "time": slot.time,
                    "movie": movie_id,
                    "ticketPrice": (
                        theatre_default[
                            "ticketPrice"
                        ]
                    ),
                    "theatre": theatre_id,
                    "screen": screen_id,
                }

                planned.append(
                    {
                        "action": "create",
                        "payload": payload,
                        "movieName": (
                            movie.get(
                                "movieName",
                                movie_id
                            )
                        ),
                        "theatreName": (
                            theatre_name
                        ),
                        "screenName": screen.get("name", screen_id),
                        "screenCapacity": screen.get("capacity"),
                    }
                )

                # Prevent another planned show
                # from using this exact Screen slot.
                occupied_screen_slots.add(
                    screen_slot_key
                )

                today_counts[
                    movie_id
                ] += 1

                existing_assignments[
                    today_key
                ][movie_id] += 1

    return planned


def summarize_plan(plan: list[dict[str, Any]], apply: bool = False) -> dict[str, int]:
    summary = {
        "shows_planned": len(plan),
        "would_create": 0,
        "created": 0,
        "skipped_no_active_screen": 0,
        "skipped_no_screen_assignment": 0,
        "skipped_invalid_screen_assignment": 0,
        "skipped_occupied": 0,
        "screen_api_errors": 0,
        "errors": 0,
    }

    for item in plan:
        if item.get("action") == "create":
            summary["created" if apply else "would_create"] += 1
            continue

        reason = item.get("reason")
        if reason == "NO_ACTIVE_SCREEN":
            summary["skipped_no_active_screen"] += 1
        elif reason == "NO_SCREEN_ASSIGNMENT":
            summary["skipped_no_screen_assignment"] += 1
        elif reason == "INVALID_SCREEN_ASSIGNMENT":
            summary["skipped_invalid_screen_assignment"] += 1
        elif reason == "OCCUPIED":
            summary["skipped_occupied"] += 1
        elif reason == "SCREEN_API_ERROR":
            summary["screen_api_errors"] += 1
        else:
            summary["errors"] += 1

    return summary

def stale_show_report(
    shows: list[dict[str, Any]],
    retention_days: int,
) -> list[dict[str, Any]]:
    """
    Report-only cleanup candidates.
    We deliberately do not delete shows because bookings may reference them.
    """
    cutoff = datetime.now().date() - timedelta(days=retention_days)
    stale = []
    for show in shows:
        parsed = parse_mongo_date(show.get("date"))
        if parsed and parsed.date() < cutoff:
            stale.append(show)
    return stale


def print_plan(plan: list[dict[str, Any]], limit: int | None = None) -> None:
    rows = plan if limit is None else plan[:limit]
    for idx, item in enumerate(rows, start=1):
        if item.get("action") == "skip":
            print(
                f"{idx:03d}. Theatre: {item['theatreName']} | "
                f"Date: {item['date']} | Time: {item['time']} | "
                f"Show Name: {item['showName']} | "
                f"Action: SKIPPED - {item['reason'].replace('_', ' ')}"
            )
            continue

        p = item["payload"]
        print(
            f"{idx:03d}. Theatre: {item['theatreName']} | "
            f"Screen: {item['screenName']} | "
            f"Screen Capacity: {item['screenCapacity']} | "
            f"Date: {p['date']} | Time: {p['time']} | "
            f"Show Name: {p['name']} | Movie: {item['movieName']} | "
            f"Ticket Price: ₹{p['ticketPrice']} | Action: WOULD CREATE"
        )
    if limit is not None and len(plan) > limit:
        print(f"... plus {len(plan) - limit} more planned shows")


def print_summary(summary: dict[str, int]) -> None:
    print(f"Shows planned: {summary['shows_planned']}")
    print(f"Would create: {summary['would_create']}")
    print(f"Created: {summary['created']}")
    print(f"Skipped - no active screen: {summary['skipped_no_active_screen']}")
    print(f"Skipped - no screen assignment: {summary['skipped_no_screen_assignment']}")
    print(f"Skipped - invalid screen assignment: {summary['skipped_invalid_screen_assignment']}")
    print(f"Skipped - occupied: {summary['skipped_occupied']}")
    print(f"Screen API errors: {summary['screen_api_errors']}")
    print(f"Errors: {summary['errors']}")


def run(config: dict[str, Any], apply: bool, show_limit: int | None) -> int:
    client = ApiClient(config)
    client.login()

    movies = client.get_movies()
    theatres = client.get_theatres()
    active = active_theatres(theatres)

    for theatre in active:
        LOG.info(
            "Eligible theatre: %s (%s)",
            theatre.get("name"),
            mongo_id(theatre.get("_id")),
        )

    shows = client.get_all_shows(active)

    screens_by_theatre: dict[str, list[dict[str, Any]]] = {}
    screen_errors: dict[str, str] = {}
    for theatre in active:
        theatre_id = mongo_id(theatre.get("_id"))
        try:
            screens_by_theatre[theatre_id] = client.get_screens_by_theatre(theatre_id)
        except Exception as exc:
            screen_errors[theatre_id] = str(exc)
            LOG.error(
                "Failed to fetch screens for theatre %s (%s): %s",
                theatre.get("name"),
                theatre_id,
                exc,
            )

    LOG.info(
        "Loaded %d movies, %d theatres (%d active), %d shows.",
        len(movies),
        len(theatres),
        len(active),
        len(shows),
    )

    plan = build_plan(
        movies,
        theatres,
        shows,
        config,
        screens_by_theatre=screens_by_theatre,
        screen_errors=screen_errors,
    )
    print(f"\nPlanned new shows: {len(plan)}")
    print_plan(plan, show_limit)
    print()
    print_summary(summarize_plan(plan, apply=False))

    retention = int(config["schedule"].get("stale_report_retention_days", 90))
    stale = stale_show_report(shows, retention)
    print(
        f"\nHistorical shows older than {retention} days: {len(stale)} "
        "(report only; nothing is deleted)"
    )

    if not apply:
        print("\nDRY RUN: no shows were created.")
        return 0

    created = 0
    failures = 0
    print("\nApplying schedule...")
    for item in plan:
        if item.get("action") != "create":
            continue

        payload = item["payload"]
        try:
            response = client.create_show(payload)
            created += 1
            LOG.info(
                "Created %s %s | %s | %s",
                payload["date"],
                payload["time"],
                item["theatreName"],
                item["movieName"],
            )
        except Exception as exc:
            failures += 1
            LOG.error(
                "Failed %s %s | %s | %s: %s",
                payload["date"],
                payload["time"],
                item["theatreName"],
                item["movieName"],
                exc,
            )

    print(f"\nCreated: {created}")
    print(f"Failed:  {failures}")
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="BookMyShow rolling show scheduler")
    parser.add_argument(
        "--config",
        default="show_scheduler_config.json",
        help="Path to scheduler JSON config",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--apply",
        action="store_true",
        help="Actually create missing shows through the API",
    )
    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview only (default)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of planned rows printed to console",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=("DEBUG", "INFO", "WARNING", "ERROR"),
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s | %(levelname)s | %(message)s",
    )

    try:
        config = load_config(args.config)
        return run(config, apply=args.apply, show_limit=args.limit)
    except KeyboardInterrupt:
        LOG.warning("Cancelled.")
        return 130
    except Exception as exc:
        LOG.exception("Scheduler failed: %s", exc)
        return 1


if __name__ == "__main__":
    sys.exit(main())
