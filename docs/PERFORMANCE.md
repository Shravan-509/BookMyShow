# Performance Review

## Frontend

| Area | Implementation |
| --- | --- |
| Route splitting | `React.lazy` and `Suspense` in `App.jsx` |
| Rendering | `memo`, `useMemo`, `useCallback` in shared components |
| State selection | Reselect selectors in slices and utility selectors |
| Perceived loading | Ant Design `Skeleton` and `Spin` states in selected movie, show, seat, and booking screens |
| Image behavior | Static SVG/WebP assets served by Vite; further image optimization is a future enhancement |

## Backend

| Area | Implementation |
| --- | --- |
| Compression | `compression` middleware for responses larger than 1 KB |
| Request timing | `X-Response-Time` header |
| Logging | Request method, path, status, and duration |
| Caching | `node-cache` for shared catalogue GET endpoints |
| Cache-Control | Static assets use long-lived public caching; API responses default to `private, no-store` |
| Rate limiting | General, auth, and booking limiters |
| Seat concurrency | Atomic MongoDB update with `$nin` and `$push/$each` |

## Performance Recommendations

| Priority | Recommendation |
| --- | --- |
| High | Add database indexes for high-traffic lookup fields such as `shows.movie`, `shows.theatre`, `bookings.user`, and `bookings.show` |
| Medium | Invalidate remaining shared catalogue cache entries after movie/show mutations |
| Medium | Add pagination for admin bookings/users once data grows |
| Medium | Remove noisy console logging from production paths |
| Low | Add bundle analysis to understand large frontend chunks |
