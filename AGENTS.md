# AGENTS.md

Single source of conventions for humans and coding agents working in this repo. The delivery plan
lives in [`docs/implementation-plan.md`](docs/implementation-plan.md); keep its checkboxes up to date.

## 1. Project overview

Smart Loan & Credit Risk Calculator: evaluates `mortgage`, `personal` and `auto` loans and returns a
repayment summary plus a streamed (mock, illustrative) credit risk assessment.

- **Stack:** Next.js 15 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS v3, Zod, Vitest +
  Testing Library, ESLint 8 (`.eslintrc.json`), Prettier.
- **Node:** 20+ (`.nvmrc`, `engines.node`). Use `nvm use`.
- **Commands**
  - `npm ci` - install from the lockfile
  - `npm run dev` - dev server on http://localhost:3000
  - `npm run verify` - lint + type-check + test + build (the gate)
  - `npm test` / `npm run test:watch` - Vitest (`tests/unit` runs in node, `tests/components` in jsdom)
  - `npm run test:e2e` - Playwright smoke tests (first run: `npx playwright install --with-deps chromium`; not part of `verify`)
  - `npm run lint`, `npm run type-check`, `npm run format` / `npm run format:check`

### Layout

```
app/          routes, layout, Server Actions (app/actions)
components/   React components (form/, results/, ui/ subfolders)
lib/          framework-free domain code: finance/, credit/, validation/, utils/
types/        shared types (types/loan.ts holds the discriminated unions)
tests/        unit/ (node), components/ (jsdom), e2e/ (Playwright)
docs/         implementation plan and other documentation
```

Create folders only when a file lands in them; no placeholder files.

## 2. Coding standards

- Server Components by default. Add `'use client'` only when a hook or event handler requires it, and
  push the boundary as deep into the tree as possible.
- Named exports for non-route modules. Default exports only where Next.js requires them (`page`,
  `layout`, `error`, `loading`, config files).
- One component per file. Component files are PascalCase (`LoanForm.tsx`); utility/module files are
  kebab-case (`assert-never.ts`).
- No `console.*` in committed code. Errors are returned as values or thrown to an error boundary.
- Import via the `@/` alias (no deep relative paths); use `import type` for type-only imports.
- Format with Prettier (`npm run format`); do not hand-format.

## 3. Type rules

- `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noImplicitReturns` and `forceConsistentCasingInFileNames` are mandatory. Do not weaken
  `tsconfig.json`.
- **No `any`** (explicit or implicit). No `// @ts-ignore`; `// @ts-expect-error` only with a linked
  issue (the single exception is the intentional compile-failure probes in `tests/unit/types`).
- **No type assertions (`x as T`, `<T>x`) and no non-null `!`.** Use type guards, schema parsing,
  `satisfies`, or exhaustive narrowing. `as const` is allowed. Lint enforces this
  (`consistent-type-assertions: never`, `no-non-null-assertion`).
- Loan state **must** be modelled as the discriminated union on `loanType` in `types/loan.ts`
  (`mortgage` | `personal` | `auto`). Never add optional "bag of fields" interfaces for
  category-specific data.
  - `mortgage` requires `propertyAddress` and `downPayment`
  - `personal` requires `loanPurpose`
  - `auto` requires `vehicleVin`
- Every `switch` over a union is exhaustive and ends in `assertNever` (`lib/utils/assert-never.ts`);
  `switch-exhaustiveness-check` is enforced by lint.
- Use `unknown` for untrusted input and parse it at the boundary (`lib/validation`). Everything past
  the parser is fully typed.

## 4. Component constraints

- Forms use `<form action={fn}>` with Server Actions. No `onSubmit` + `preventDefault` + `fetch` for
  submission, and no API routes for submission.
- Pending UI comes from `useFormStatus` in a **child** of the `<form>` (e.g. `SubmitButton`), never from
  a parent `useState` flag. `useFormStatus` reports idle if called in the component that renders the
  `<form>` itself.
- Form-level state uses `useActionState`; optimistic UI uses `useOptimistic`.
- Async data is consumed with `use()` inside a component wrapped in `<Suspense>` with a skeleton
  fallback and an error boundary. Promises passed to `use()` are created outside render (in a Server
  Action or cache), never inside the consuming component.
- Presentational components take already-computed props; no financial math inside components.
- Accessibility: labelled inputs, `aria-live` for results/errors, `aria-busy` while pending.

## 5. Domain rules

- Money: compute inside `lib/finance` only, round at presentation (or compute in integer cents with
  documented rounding). Handle a 0% rate without dividing by zero.
- Amortization lives only in `lib/finance`; scoring lives only in `lib/credit`.
- `lib/` and `types/` import nothing from `react` or `next`.
- The mock credit engine is not a real credit model: UI copy must label results as illustrative, and no
  PII is persisted.

## 6. Testing rules

- Every new `lib/*` function has a unit test.
- Every new union variant requires a narrowing test and updated exhaustive switches.
- Component tests live in `tests/components` (jsdom); pure logic tests in `tests/unit` (node).
- Time-dependent and random behaviour is injected (fake timers, `random`, `latencyMs`) so tests are
  deterministic.

## 7. Definition of done

- `npm run verify` passes (lint, type-check, test, build) with no new warnings.
- Plan checkboxes in `docs/implementation-plan.md` are updated for the work done; README and this file
  reflect structural changes.

## 8. Out of scope / do not

- No new dependencies without justification in the PR description.
- No API routes for submission (Server Actions only).
- No upgrade to Tailwind v4 / ESLint 9 flat config inside feature work (separate follow-up PR).
- Do not disable the `any` / type-assertion lint rules; tune other rules per-rule when noisy.
- Do not add a `CLAUDE.md`; this file is the only convention file.

## Known temporary exceptions

- `components/LoanForm.tsx` and `components/Calculator.tsx` are interim shells that still use
  `onSubmit` + `preventDefault` (section 4) and do not calculate anything; they are rewritten around
  a Server Action in plan steps 3.6/3.7. No lint overrides remain for them.
