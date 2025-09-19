# Repository Guidelines

## Project Structure & Module Organization
This Vite-powered React app keeps runtime source in `src/`. `main.jsx` boots `App.jsx`; route-level views live in `src/pages/` (for example `ModuleControl.jsx`, `MQTTPage.jsx`). Shared UI stays in `src/components/`, data helpers in `src/hooks/`, and shared state in `src/contexts/`. Configuration constants sit in `src/constants/`; shared styles live under `src/styles/`. Static assets belong in `public/`, and Vite writes production builds to `dist/`, which should remain throwaway.

## Build, Test, and Development Commands
- `npm install`: restore dependencies whenever `package.json` changes.
- `npm run dev`: start the Vite dev server on http://localhost:5173 with hot reloading.
- `npm run build`: produce the optimized bundle in `dist/`; run before packaging or deploying.
- `npm run preview`: serve the latest build to validate production behavior locally.
Bring your own test script (see below) until we wire Vitest into `package.json`.

## Coding Style & Naming Conventions
Follow 4-space indentation, double quotes, and trailing semicolons. React components and files use PascalCase (`DarkModeToggle.jsx`), hooks use camelCase with a `use` prefix (`useMQTT.js`), and constant groups stay in UPPER_SNAKE_CASE. Prefer named exports for reusable elements; reserve default exports for pages. Keep CSS class names kebab-case and shareable styles in `src/styles/`.

## Testing Guidelines
Automated tests are not yet committed; new work should introduce Vitest plus React Testing Library. Place suites beside code (`FeatureName.test.jsx`) or mirror the structure under `src/__tests__/`. Focus on MQTT connection flows and command publishing, mocking broker calls to keep tests hermetic. Target about 80 percent line coverage for new modules and note intentional gaps in the pull request.

## Commit & Pull Request Guidelines
Recent history favors single-sentence, imperative commit subjects ("Consolidate camera MQTT topic management"). Keep bodies optional but include rationale for behavioral changes. For pull requests, supply a concise summary, screenshots or GIFs for UI shifts, linked issue IDs, and a checklist of manual or automated tests run. Use draft pull requests while features evolve.

## Environment & Configuration
Copy `.env.example` to `.env` and provide broker host, port, and credentials before running `npm run dev`. Never commit secrets; rely on local overrides or CI variables. When you add environment keys, update `.env.example` along with any setup notes in the README.

## Communication Guidelines
Default to Korean in all written responses and discussions, matching user tone and formality unless they explicitly request another language. Provide English summaries only when asked, and document any language-specific decisions in pull requests or issue comments.
