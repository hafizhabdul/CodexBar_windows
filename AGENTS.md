# Repository Guidelines

## Project Structure & Modules
- `src/main`: Electron main process (tray, providers, storage).
- `src/renderer`: React + TailwindCSS UI (settings, usage dashboard).
- `src/shared`: Shared TypeScript types.
- `dist-electron`: Compiled Electron output.
- `docs`: Provider reference docs.

## Build, Test, Run
- Dev: `npm run dev` — starts Vite + Electron in dev mode with hot reload.
- Build: `npm run build` — compiles TypeScript, bundles with Vite, packages with electron-builder.
- Build (unpackaged): `npm run build:unpack` — builds without creating installer.
- Type check: `npm run typecheck`.

## Coding Style & Naming
- TypeScript strict mode. 2-space indent.
- Use React functional components with hooks.
- Favor small, typed interfaces; keep components focused.
- Use TailwindCSS for styling.

## Commit & PR Guidelines
- Commit messages: short imperative clauses (e.g., "Add provider card", "Fix tray icon").
- PRs/patches should list summary, commands run, screenshots for UI changes.

## Agent Notes
- This is a Windows-only Electron app (system tray). Do not add macOS/Linux build targets.
- Use `npm` as package manager (not pnpm/yarn).
- Keep provider data siloed: never mix identity/plan fields from different providers.
- After code changes, run `npm run typecheck` to verify no type errors.
