# BookMyShow Show Scheduler

This utility maintains a rolling set of future shows through the existing
BookMyShow REST APIs.

## Why Python?

The workflow needs stateful logic: fetch the current movie catalogue, fetch
active theatres, inspect existing future shows, avoid duplicate slots, include
new movies automatically, respect release dates, and run periodically. Python
is easier to maintain for this than a large Postman pre-request/test script.

## Files

- `show_scheduler.py` - scheduler
- `show_scheduler_config.json` - endpoints and scheduling rules
- `show_scheduler.env.example` - credential variable names
- `requirements.txt` - Python dependency

## Important assumptions

The supplied Mongo exports show the current Show fields as:

- `name`
- `date`
- `time`
- `movie`
- `ticketPrice`
- `totalSeats`
- `bookedSeats`
- `theatre`
- `screen`

The scheduler is Screen-aware. New scheduled Shows must include `screen` so
they do not become `Legacy / Unassigned`. For Screen-associated Shows, the
backend derives `totalSeats` from `Screen.capacity`, so the scheduler does not
send `totalSeats`.

The existing data also uses common slots around morning, afternoon, first show,
and second show; those are configurable.

### API endpoint paths

The provided config assumes:

```text
POST /bms/v1/auth/login
GET  /bms/v1/movies
GET  /bms/v1/theatres
GET  /bms/v1/theatres/:theatreId/screens?activeOnly=true
GET  /bms/v1/shows/theatre/:theatreId
POST /bms/v1/shows
```

If your actual route is, for example, `/shows/add` or `/shows/add-show`, change
only `endpoints.create_show` in `show_scheduler_config.json`.

## Installation

```bash
cd scripts/show-scheduler
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Credentials

Do not hard-code credentials in the script or commit them.

```bash
export BMS_SCHEDULER_EMAIL="partner@example.com"
export BMS_SCHEDULER_PASSWORD="your-password"
```

For local development, you may source them from an ignored shell file.

## First run — dry run

Dry-run is the default and makes no changes:

```bash
python show_scheduler.py \
  --config show_scheduler_config.json \
  --dry-run
```

To print only the first 30 planned rows:

```bash
python show_scheduler.py \
  --config show_scheduler_config.json \
  --dry-run \
  --limit 30
```

## Create shows

After checking the dry-run output:

```bash
python show_scheduler.py \
  --config show_scheduler_config.json \
  --apply
```

## Scheduling rules

By default:

- maintain the next 7 calendar days;
- only schedule active theatres;
- never schedule a movie before its `releaseDate`;
- prefer recent releases using weighted selection;
- use one movie per theatre per day;
- create four daily show slots;
- treat Screen-aware occupied slots as `screen + date + time`;
- conservatively treat legacy Shows without a Screen as occupying
  `theatre + date + time`;
- infer a theatre's default `ticketPrice` from its most recent existing show;
- fall back to global defaults if a theatre has no previous shows.

A new movie added through the application automatically becomes eligible on
the next scheduler run because movies are fetched from the API every time.

## Screen rules

Before planning Shows for a Theatre, the scheduler fetches active Screens using
`GET /bms/v1/theatres/:theatreId/screens?activeOnly=true`.

- zero active Screens: skip and report `SKIPPED - NO ACTIVE SCREEN`;
- one active Screen: use that Screen automatically and submit its Screen id;
- multiple active Screens: require explicit configuration and skip if missing;
- API failure while fetching Screens: skip that Theatre for the run.

The scheduler never defaults to Screen 1, never chooses the first returned
Screen, and never infers Screen from capacity.

## Multiplex screen assignments

Multiplex Theatres require explicit Screen assignment by Theatre id and slot
time:

```json
"screen_assignments": {
  "680d0b24dc0716a3459f2ca2": {
    "10:30": "681111111111111111111111",
    "14:30": "682222222222222222222222",
    "18:30": "683333333333333333333333",
    "21:30": "681111111111111111111111"
  }
}
```

Theatre name may be used as a fallback key, but Theatre id is preferred because
it is stable. Configured Screen ids are accepted only when they exist in the
fetched active Screen list and belong to the Theatre. Invalid assignments are
reported as `SKIPPED - INVALID SCREEN ASSIGNMENT`.

## Theatre price overrides

You can override price by theatre id or exact theatre name:

```json
"theatre_defaults": {
  "680d0b24dc0716a3459f2ca2": {
    "ticketPrice": 250
  },
  "Jagadamba 70MM Premium Laser 4K Images: Vizag": {
    "ticketPrice": 175
  }
}
```

Legacy `totalSeats` defaults remain in config for older data compatibility, but
new Screen-associated scheduler payloads do not send `totalSeats`.

## Cleanup behavior

The scheduler intentionally does **not delete past shows**.

Historical Bookings may reference Show documents, so deleting them can break
booking history and ticket/report lookups.

Instead, every run reports how many shows are older than
`stale_report_retention_days`.

Recommended backend behavior is to hide old shows from customer catalogue
queries and retain them for history. If you later introduce `isArchived`, the
scheduler can be extended to archive instead of delete.

## Daily cron example

Run every day at 01:00:

```cron
0 1 * * * cd /absolute/path/to/scripts/show-scheduler && \
  /absolute/path/to/.venv/bin/python show_scheduler.py \
  --config show_scheduler_config.json --apply \
  >> show_scheduler.log 2>&1
```

Do not commit `show_scheduler.log`.

## Recommended backend protection

For strong idempotency in the Screen-aware model, prefer a unique MongoDB index
for:

```js
showSchema.index(
  { screen: 1, date: 1, time: 1 },
  { unique: true }
)
```

Do this only after checking existing data. Legacy Shows without `screen` still
need conservative Theatre-level handling in the scheduler.

## Suggested project location

```text
BookMyShow/
└── scripts/
    └── show-scheduler/
        ├── README.md
        ├── requirements.txt
        ├── show_scheduler.py
        ├── show_scheduler_config.json
        └── show_scheduler.env.example
```
