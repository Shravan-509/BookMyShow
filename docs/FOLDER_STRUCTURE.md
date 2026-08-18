# Folder Structure

```text
BookMyShow/
├── Client/
│   ├── public/
│   │   └── _redirects
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── movies/
│   │   │   ├── partner/
│   │   │   └── profile/
│   │   ├── hooks/
│   │   ├── redux/
│   │   │   ├── actions/
│   │   │   ├── reducers/
│   │   │   ├── sagas/
│   │   │   └── slices/
│   │   └── utils/
│   └── package.json
├── Server/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   │   └── email_templates/
│   └── package.json
├── docs/
├── .github/
├── README.md
└── LICENSE
```

## Organization Rationale

- `Client/src/features` groups UI by product domain.
- `Client/src/api` isolates HTTP contracts from components.
- `Client/src/redux` centralizes global state, reducers, slices, and sagas.
- `Server/routes` maps HTTP endpoints to controller methods.
- `Server/controllers` owns validation, business workflows, payment verification, and email/PDF side effects.
- `Server/models` keeps Mongoose schemas independent from controllers.
- `docs` contains centralized technical documentation for reviewers and maintainers.
