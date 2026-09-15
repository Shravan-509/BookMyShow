# Changelog

All notable project documentation and repository-quality changes are tracked here.

## Unreleased

- Added Phase 3 Physical Seat Management with persistent Seat documents, Seat Management UI, manual and sequential bulk layout generation, and Screen capacity invariants.
- Added Phase 4A ShowSeat inventory foundation with per-show Seat snapshots, historical ShowSeat migration documentation, and automatic transactional initialization for new screen-aware Shows.
- Added Phase 4B customer ShowSeat booking integration with the customer availability API, physical SeatLayout rendering, ShowSeat booking synchronization, seat-type pricing, Booking pricing snapshots, and Checkout/history/PDF/email display support.
- Added Phase 4C booking experience redesign across Showtime Selection, Seat Selection, Checkout, and Booking Confirmation, including shared `BookingProgress`, `BookingSummaryCard`, the protected `/booking-confirmation/:bookingId` route, QR display, and documented refresh/download limitations.
- Hardened backend payment validation, booking-history authorization, privileged route role checks, partner ownership checks, and API cache-control behavior.
- Added capstone-focused documentation set under `docs/`.
- Added API, database, security, performance, deployment, state management, diagram, and screenshot documentation.
- Added open-source community files: contributing guide, code of conduct, security policy, pull request template, issue templates, and CI workflow.
- Updated repository documentation for Woolf/Scaler review readiness.
