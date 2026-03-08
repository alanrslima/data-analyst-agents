# Contributing

Thanks for contributing to Data Analyst Agents.

## Prerequisites

- Node.js 20+
- npm 10+
- Ollama installed and running (`http://localhost:11434`)
- At least one local model pulled (for example `llama3.2` or `mistral`)

## Project structure

- `api/` - Express + TypeScript backend
- `frontend/` - React + TypeScript + Vite app
- `docs/` - Static documentation assets

## Local setup

1. Install API dependencies:

```bash
cd api
npm install
cp .env.example .env
```

2. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

3. Run both apps in separate terminals:

```bash
# Terminal 1
cd api
npm run dev

# Terminal 2
cd frontend
npm run dev
```

## Development workflow

1. Create a branch from `main`:

```bash
git checkout -b feat/short-description
```

2. Make focused changes with clear scope.
3. Run checks before opening a PR.
4. Open a pull request with a concise summary and testing notes.

## Quality checks

Run these before submitting changes.

```bash
# API
cd api
npm run lint
npm run build

# Frontend
cd ../frontend
npm run lint
npm run build
```

## Coding guidelines

- Keep changes small and task-focused.
- Prefer explicit types in shared/public interfaces.
- Avoid breaking API contracts consumed by `frontend/src/services/api.ts`.
- Preserve structured logging and metrics behavior in the API.
- Update docs (`README.md`, `docs/`) when behavior or endpoints change.

## Pull request checklist

- [ ] Lint and build pass for both `api` and `frontend`
- [ ] Changes are scoped to one purpose
- [ ] Public behavior changes are documented
- [ ] Screenshots or examples added for UI changes (when applicable)
- [ ] No unrelated formatting-only churn

## Reporting issues

When filing a bug, include:

- Steps to reproduce
- Expected vs actual behavior
- API logs (if relevant)
- Environment details (`node -v`, OS, model used)
