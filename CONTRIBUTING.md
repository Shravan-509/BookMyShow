# Contributing

Thank you for considering a contribution to BookMyShow.

## Local Setup

1. Fork and clone the repository.
2. Install client dependencies:

```bash
cd Client
npm install
```

3. Install server dependencies:

```bash
cd Server
npm install
```

4. Create local `.env` files using the variables documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Development Guidelines

- Keep frontend changes inside the relevant `Client/src/features` module where possible.
- Keep backend changes organized by route, controller, model, middleware, or utility.
- Do not commit secrets, local `.env` files, generated logs, or OS metadata.
- Update docs when changing API behavior, environment variables, data models, authentication, or deployment.
- Prefer small pull requests with a clear scope.

## Pull Request Checklist

- Code builds locally.
- Relevant docs are updated.
- No secrets or local-only files are committed.
- Screenshots are included for UI changes.
- API changes include request/response examples.

