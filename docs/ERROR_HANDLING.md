# Error Handling Strategy

## Backend

Controllers use `try/catch` blocks and pass unexpected errors to `next(error)`. Known domain failures are still returned directly from controllers with a `success: false` shape and a user-facing `message`.

The central Express error middleware normalizes uncaught backend errors into the frontend-compatible response shape:

```json
{
  "success": false,
  "message": "error message",
  "code": "OPTIONAL_SAFE_CODE"
}
```

| Scenario | Response behavior |
| --- | --- |
| Missing registration fields | `400` with missing fields message |
| Duplicate phone/email/payment id | `409` with duplicate-resource or payment-replay message |
| Invalid MongoDB object id | `400` with invalid identifier message |
| Mongoose validation failure | `400` with validation message |
| Invalid login | `400` or `404` with credential/account message |
| Unverified account | `401` with `UNVERIFIED_ACCOUNT` code |
| Expired verification code | `400`/`404` with invalid or expired code message |
| Expired or invalid JWT | `401` with authentication message |
| Role mismatch | `403` with insufficient-permissions message |
| Seats unavailable | `409` with unavailable seat list |
| Invalid Razorpay signature | `400` invalid payment response |
| Razorpay SDK failure | Sanitized payment gateway message without provider internals |
| Unknown `/bms/v1` endpoint | JSON `404` with `ROUTE_NOT_FOUND` code |

Production responses do not include stack traces, filesystem paths, database connection details, JWT/Razorpay secrets, password hashes, verification codes, reset tokens, or environment variable values.

## Frontend

Redux-Saga handlers normalize errors with:

```js
error.response?.data?.message || error.message || "Something went wrong"
```

They dispatch failure actions and use Ant Design notifications for user-visible failures.

## Improvement Opportunities

- Migrate simple controllers to the shared `asyncHandler` helper incrementally.
- Add request correlation IDs for debugging production incidents.
- Use structured logging rather than console-only logs.
