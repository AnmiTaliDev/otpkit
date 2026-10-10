# otpkit

Headless one-time code input components for React, Preact, Vue, Svelte, SolidJS, Angular, Lit and plain DOM, sharing one framework-agnostic core.

## Dependencies

Runtime:

- The framework of the chosen adapter, as a peer dependency.
- `@anmitalidev/otpkit-core`, installed together with every adapter.

Development:

- Node.js 22.22.3 or newer (24.15+ and 26+ also work) and npm.
- TypeScript 6.0, tsdown, Vite, Vitest, jsdom, ESLint.
- Angular CLI and ng-packagr for the Angular adapter, `@sveltejs/package` for the Svelte adapter.

## Build

```sh
npm install
npm run build
npm run typecheck
npm test
npm run lint
```

`npm run build` builds the core first, because every adapter and example resolves it from its `dist` directory.

## Usage

Adapters are published as `@anmitalidev/otpkit-<name>`, where `<name>` is one of `react`, `preact`, `vue`, `svelte`, `solid`, `angular`, `lit` or `vanilla`.

```tsx
import { OtpInput } from "@anmitalidev/otpkit-react"

<OtpInput length={6} type="numeric" onComplete={(code) => verify(code)} />
```

A runnable app for every framework is in [examples/](examples/).

### Props

| Prop | Default | Description |
| --- | --- | --- |
| `length` | `6` | Number of cells. |
| `value` | | Current code. Controlled when set. |
| `type` | `"numeric"` | `"numeric"` or `"alphanumeric"`. |
| `disabled` | `false` | Disables all cells. |
| `autoFocus` | `false` | Focuses the first cell on mount. |
| `mask` | `false` | Renders cells as `type="password"`. |
| `name` | | Adds a hidden input with this name that holds the joined value. |
| `placeholder` | | Placeholder text for every cell. |
| `ariaLabel` | `"One-time code"` | Accessible label of the group. |
| `onChange(value)` | | Called when the value changes. |
| `onComplete(value)` | | Called when all cells are filled. |

Names follow each framework's conventions. Examples: `v-model` and `@complete` in Vue, `bind:value` and `oncomplete` in Svelte, `[(value)]` and `(complete)` in Angular. The Angular input is named `label`. The Lit element reads `aria-label` from its attributes and dispatches `value-change` and `complete` events.

### Data attributes

No CSS is shipped. Each cell is an `<input>` with `data-otp-cell`, and state is exposed through `data-filled`, `data-focused`, `data-invalid` and `data-disabled`. The attributes are present with an empty value when true and absent otherwise.

```css
[data-otp-cell][data-focused] {
  outline: 2px solid;
}
```

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
