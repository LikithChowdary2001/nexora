# Contributing to Nexora

## Development Setup

See [SETUP.md](./SETUP.md).

## Code Standards

- TypeScript strict mode
- Backend: Controllers → Services → Repositories → Firebase
- Shared types in `@nexora/shared`
- Keep diffs focused

## Workflow

1. Create a feature branch
2. Make changes with tests where applicable
3. Run `npm run typecheck`, `npm run test`, `npm run build`
4. Open a pull request against `main`

## Security

Do not commit API keys or `.env` contents. See [SECURITY.md](./SECURITY.md).
