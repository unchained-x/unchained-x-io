# UnchainedX

**Creative Venture Studio** -- designing and expanding value, networks, and human potential through technology and creativity.

[unchainedx.io](https://unchainedx.io)

## About

UnchainedX is a creative venture studio that experimentally architects and expands the potential of value, networks, and humanity through technology and creativity. We undertake extraordinary complexity fundamentally and structurally.

## Projects

See our [Portfolio](https://unchainedx.io/portfolio) for current projects.

## Architecture

The frontend follows a **modular monolith** pattern with a **minimal hexagonal** boundary around external technology — chosen over feature-sliced design or full clean architecture because the project's complexity lives in 3D rendering, not domain logic.

```
app/
  routes/        Route entries only (loader / meta / <XxxScreen />)
  screens/       One module per route, each with index.ts public API
                   home/  portfolio/  team/  merch/  company/
                 Per-screen scene/ ui/ are implementation details.
  components/
    dom/         Cross-screen React UI (layout, overlays)
    three/       Cross-screen 3D primitives
                   canvas/ environment/ effects/ post/ materials/ tsl/
  core/
    adapters/    External technology wrappers (sanity, audio)
    services/    App-level facilities (i18n, seo)
  hooks/         Shared React hooks
  state/         Global mutable runtime state (mouseState, flowmap)
```

### Rules

- **Modules expose only `index.ts`.** Cross-screen imports are forbidden; share via `components/`, `hooks/`, `core/`, or `state/`.
- **Routes stay thin** (≤ ~50 lines). UI logic lives in `screens/<name>/XxxScreen.tsx`.
- **External I/O goes through `core/adapters/`.** Routes never touch `@sanity/client` directly — they call `listProjects()` etc.
- **`dom/` and `three/` never import each other.** Keeps SSR-unsafe 3D code out of DOM components.

### Vocabulary

- **Screen** — the top-level React component for a route (DOM + 3D bundled)
- **Scene** — the contents of a single `<Canvas>` (R3F root)
- **World** — a section inside the home Scene, switched by `SectionManager`
