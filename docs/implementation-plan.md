# Smart Loan & Credit Risk Calculator - Implementation Plan

Status: plan only (no application code in this change).
Audience: engineers and coding agents working in this repo.

## 0. Goal and scope

An interactive calculator that evaluates three loan categories - `mortgage`, `personal`, `auto` - and returns a repayment summary plus a streamed (mock) credit risk assessment.

Non-negotiable requirements:

1. **Strict TypeScript.** Loan application state is a discriminated union on `loanType`, so impossible states cannot be represented:
   - `mortgage` requires `propertyAddress` and `downPayment`
   - `personal` requires `loanPurpose`
   - `auto` requires `vehicleVin`
   - No `any`, no loose type assertions (`as`). `as const` and `import x = ...` are the only tolerated uses of the keyword (`as const` is not a type assertion in the unsound sense); `satisfies` is preferred.
2. **React 19 + Next.js App Router.**
   - Native `<form action={...}>` posting to Server Actions.
   - `useFormStatus` inside child submit buttons for pending state.
   - Async credit scoring streamed with React 19 `use()` inside a component wrapped in `<Suspense>`.
   - `useActionState` for form state, `useOptimistic` where it fits.
3. **Conventions.** A root `AGENTS.md` defines coding standards, type rules and component constraints. (There is no `CLAUDE.md` in this repo, so nothing needs renaming - `AGENTS.md` is simply created in Phase 1.)

---

## 1. Current state of the repo (inspected)

Branch `main`, 3 commits, no lockfile, no `node_modules`, no tests, no `AGENTS.md`/`CLAUDE.md`.

### 1.1 What already exists

| Area | Present today |
| --- | --- |
| Framework | `next@^15.0.0`, `react@^19.0.0`, `react-dom@^19.0.0` (Next 15 App Router, React 19 compatible) |
| Language | `typescript@^5.3.3`; `tsconfig.json` has `strict: true`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `@/*` -> `./*` alias, `moduleResolution: bundler`, `jsx: react-jsx` |
| Styling | Tailwind **v3.4** (`tailwind.config.ts`, `postcss.config.js`, `@tailwind` directives in `app/globals.css`); custom colors `primary/secondary/danger/warning`; content globs cover `app/` and `components/` only |
| Lint | ESLint 8 + `eslint-config-next@^15` via `.eslintrc.json` (`next/core-web-vitals` only) |
| Scripts | `dev`, `build`, `start`, `lint`, `type-check` |
| App | `app/layout.tsx`, `app/page.tsx` (renders `<Calculator />`), `app/globals.css` |
| Components (all flat in `components/`) | `Calculator.tsx`, `LoanForm.tsx`, `RiskEvaluation.tsx`, `RepaymentSchedule.tsx` |
| Types | `types/index.ts` with `LoanCategory = 'Mortgage' \| 'Personal' \| 'Auto'`, flat `LoanData`, `RiskResult` |
| Docs | `README.md` (project structure section already lists a future `app/api/`) |

### 1.2 Gaps / conflicts with the requirements (to be fixed, not preserved)

| Existing code | Problem | Resolution (phase) |
| --- | --- | --- |
| `types/index.ts` flat `LoanData` | Single interface, no per-category fields; impossible states representable | Replace with `types/loan.ts` discriminated unions (P2) |
| `LoanCategory` values are capitalized (`'Mortgage'`) | Requirement mandates lowercase `'mortgage' \| 'personal' \| 'auto'` and field name `loanType` | Rename to `LoanType`, lowercase (P2) |
| `LoanForm.tsx` uses `onSubmit` + `useState` + `e.preventDefault()` | Not a native `<form action>`; no Server Action; no `useFormStatus` | Rewrite around Server Action (P3) |
| `LoanForm.tsx` `value as LoanCategory` | Forbidden type assertion | Parse with a type guard / schema (P2, P3) |
| `employmentStatus: string` | Loose string | Narrow to a literal union (P2) |
| `Calculator.tsx` `fetch('/api/evaluate-risk')` + manual `ReadableStream` SSE parsing + `useState` loading flags | Route does not exist; wrong streaming model (should be `use()` + `Suspense`); `catch (e)` swallow + `console.error` | Delete; replace with action + `use()` (P3/P4) |
| `Calculator.tsx` `level: 'unknown' \| 'error'` in `RiskResult` | Error/unknown states mixed into a success shape | Model result as a union: success / failure (P2) |
| `RepaymentSchedule.tsx` amortization math inline in render, hardcoded 6.5% rate, `const schedule = []` (implicit `any[]`), divides by zero when rate is 0 | Untestable logic in component; implicit any | Extract pure `lib/finance/amortization.ts`, rate per loan type/risk (P2) |
| `RiskEvaluation.tsx` `getRiskColor(level: string)` | Stringly typed | Exhaustive `switch` on `RiskLevel` with `never` check (P3/P4) |
| All components `'use client'` | Needless client boundary; everything client-rendered | Server Components by default; `'use client'` only where hooks are needed (P3) |
| `app/layout.tsx` puts `viewport` inside `metadata` | Deprecated in Next 15 (build warning) | Move to `export const viewport: Viewport` (P1) |
| `tsconfig.json` lacks `next` plugin, `incremental`, `allowJs`; `lib: ES2020` | `next build` will auto-patch it; `Promise.withResolvers`/`AbortSignal.timeout` typings need newer lib | Set `lib: ["ES2022","DOM","DOM.Iterable"]`, `target: ES2022`, add `plugins: [{ "name": "next" }]`, `incremental` (P1) |
| `tsconfig.json` `allowImportingTsExtensions`, `useDefineForClassFields` | Vite leftovers, not needed in Next | Remove (P1) |
| No lockfile / no `engines` | Non-reproducible installs | Commit `package-lock.json`, add `engines.node >=20` and `.nvmrc` (P1) |
| README "Node 18+" | Next 15 / Vitest 3 are happier on Node 20+ | Update README (P1) |
| README says "Implement `/api/evaluate-risk`" in Next Steps | Superseded by Server Actions | Update README (P1) |

---

## 2. Target architecture (summary)

```
Browser                                   Server
-------                                   ------
<LoanForm> (client, useActionState)
  <form action={formAction}> ───────────▶ submitLoanApplication(prev, formData)   [Server Action]
  <SubmitButton/> (useFormStatus)           1. parse FormData -> LoanApplication (union) or field errors
                                            2. computeRepaymentSummary()  (pure, sync)
                                            3. start assessCredit(application, { signal }) (async, NOT awaited)
  state ◀──────────────────────────────── 4. return { status:'success', application, summary, assessment: Promise }
<ResultsPanel>
  summary rendered immediately
  <Suspense fallback={<RiskSkeleton/>}>
    <RiskAssessment promise={state.assessment}/>   ← calls use(promise)
  </Suspense>
```

Key design decisions:

- **Server Actions return a Promise for the assessment.** React 19's Flight protocol can serialize Promises returned from Server Actions, which is what lets the client `use()` them under `<Suspense>`. Phase 4 starts with a short **spike** to confirm this on the installed Next 15.x version. Fallback if it does not work: a second Server Action `fetchCreditAssessment(applicationId)` called from a module-level, keyed promise cache (promise created once per submission outside render, never inside render), consumed with `use()` unchanged.
- **Pure domain core** (`lib/finance`, `lib/credit`) with no React/Next imports, so it is unit-testable in plain Node.
- **Validation at the boundary only.** `FormData` is `FormDataEntryValue` (string | File). A schema parser turns it into the `LoanApplication` union; everything past the parser is fully typed and assertion-free.
- **Server Components by default.** `'use client'` only for `LoanForm` (hooks), the type-conditional field group if it needs state, and the optimistic history list.

### 2.1 Type design (to be implemented in Phase 2)

Described, not coded here. `types/loan.ts` will export:

- `LoanType = 'mortgage' | 'personal' | 'auto'` and a `LOAN_TYPES` readonly tuple (single source of truth; type derived from tuple).
- `BaseLoanApplication` (shared): `loanAmount`, `termMonths`, `annualIncome`, `monthlyDebt`, `creditScore`, `employmentStatus: EmploymentStatus`.
- Three variants, each `BaseLoanApplication & { loanType: '<tag>' ... }`:
  - `MortgageApplication` - adds `propertyAddress: string`, `downPayment: number`
  - `PersonalApplication` - adds `loanPurpose: LoanPurpose` (literal union, e.g. `debt_consolidation | home_improvement | medical | education | other`)
  - `AutoApplication` - adds `vehicleVin: string` (17-char VIN format, no I/O/Q)
- `LoanApplication = MortgageApplication | PersonalApplication | AutoApplication`.
- Branded primitives where useful (`Usd`, `Vin`) via a unique-symbol brand created by validated constructors - **no `as`**: constructors return the brand through a schema transform or an overload-free type predicate.
- `RiskLevel = 'low' | 'medium' | 'high'`, `RiskFactor`, `CreditAssessment` (success shape only).
- `AssessmentResult = { ok: true; assessment: CreditAssessment } | { ok: false; error: AssessmentError }` so failures are values, not magic `level: 'error'`.
- `FormState` discriminated on `status`: `'idle' | 'error' | 'success'` (`error` carries `fieldErrors` keyed by valid field names for the *submitted* `loanType`; `success` carries `application`, `summary`, `assessment` promise).
- `assertNever(x: never): never` helper in `lib/utils/assert-never.ts` for exhaustiveness.

Type-narrowing contract: any consumer that does `switch (app.loanType)` must get the variant fields without casts, and adding a 4th loan type must fail `tsc` everywhere a `switch` is not exhaustive.

---

## 3. Proposed file tree

Legend: `[exists]` kept as-is or edited, `[rewrite]` exists but is fully replaced, `[new]`, `[delete]`.

```
.
├── AGENTS.md                                   [new]  coding standards, type rules, component constraints
├── README.md                                   [edit] Node 20+, structure, scripts, link to docs/
├── package.json                                [edit] deps, scripts, engines
├── package-lock.json                           [new]
├── .nvmrc                                      [new]
├── .eslintrc.json                              [edit] strict TS rules (see P1)
├── .prettierrc                                 [new]
├── next.config.js                              [exists]
├── postcss.config.js                           [exists]
├── tailwind.config.ts                          [edit] add lib/ + features/ globs
├── tsconfig.json                               [edit] ES2022, next plugin, extra strict flags
├── vitest.config.ts                            [new]
├── vitest.setup.ts                             [new]
├── playwright.config.ts                        [new]  P1: chromium, builds + serves on :3100
├── .prettierignore                             [new]  excludes lockfile, build output, this plan
├── docs/
│   └── implementation-plan.md                  [new]  this file
├── app/
│   ├── layout.tsx                              [edit] viewport export, font, a11y landmarks
│   ├── page.tsx                                [edit] Server Component shell, renders <Calculator/>
│   ├── globals.css                             [edit] drop `* { margin:0 }` reset duplicates Tailwind preflight
│   ├── loading.tsx                             [new]  route-level fallback
│   ├── error.tsx                               [new]  route error boundary ('use client')
│   └── actions/
│       └── submit-loan-application.ts          [new]  'use server' action
├── types/
│   ├── index.ts                                [delete] superseded
│   └── loan.ts                                 [new]  discriminated unions + results + form state
├── lib/
│   ├── finance/
│   │   ├── amortization.ts                     [new]  payment + schedule (pure)
│   │   ├── rates.ts                            [new]  base APR by loanType/risk
│   │   └── summary.ts                          [new]  computeRepaymentSummary()
│   ├── credit/
│   │   ├── assess-credit.ts                    [new]  mock async engine (AbortSignal-aware)
│   │   ├── scoring.ts                          [new]  pure scoring rules per loanType
│   │   └── errors.ts                           [new]  AssessmentError union
│   ├── validation/
│   │   ├── loan-schema.ts                      [new]  schema -> LoanApplication
│   │   └── parse-form-data.ts                  [new]  FormData -> ParseResult
│   └── utils/
│       ├── assert-never.ts                     [new]
│       ├── format.ts                           [new]  currency / percent formatters
│       └── sleep.ts                            [new]  abortable delay
├── components/
│   ├── Calculator.tsx                          [rewrite] composes form + results; owns useActionState
│   ├── LoanForm.tsx                            [rewrite] <form action>, no onSubmit
│   ├── RiskEvaluation.tsx                      [rewrite] presentational, exhaustive RiskLevel styles
│   ├── RepaymentSchedule.tsx                   [rewrite] presentational; takes precomputed rows
│   ├── form/
│   │   ├── SubmitButton.tsx                    [new]  'use client', useFormStatus
│   │   ├── LoanTypeSelect.tsx                  [new]
│   │   ├── CommonFields.tsx                    [new]
│   │   ├── MortgageFields.tsx                  [new]
│   │   ├── PersonalFields.tsx                  [new]
│   │   ├── AutoFields.tsx                      [new]
│   │   ├── LoanTypeFields.tsx                  [new]  exhaustive switch on loanType
│   │   └── FieldError.tsx                      [new]
│   ├── results/
│   │   ├── ResultsPanel.tsx                    [new]  summary + <Suspense> boundary
│   │   ├── RiskAssessment.tsx                  [new]  'use client', calls use(promise)
│   │   ├── RiskSkeleton.tsx                    [new]
│   │   ├── RiskErrorBoundary.tsx               [new]  class error boundary for rejected promise
│   │   └── RecentCalculations.tsx              [new]  useOptimistic history
│   └── ui/                                     [new]  Card, Badge, Skeleton primitives (only if reused 2+ times)
└── tests/
    ├── unit/
    │   ├── types/loan.type-test.ts             [new]  compile-time narrowing assertions
    │   ├── finance/amortization.test.ts        [new]
    │   ├── credit/assess-credit.test.ts        [new]
    │   └── validation/parse-form-data.test.ts  [new]
    ├── components/
    │   ├── SubmitButton.test.tsx               [new]
    │   ├── LoanForm.test.tsx                   [new]
    │   └── RiskAssessment.test.tsx             [new]
    └── e2e/
        └── smoke.spec.ts                       [new]  P1: Playwright smoke test (more specs in P5)
```

Notes:
- Existing flat `components/*.tsx` files keep their paths (imports in `app/page.tsx` stay stable); new, finer-grained components go in subfolders.
- If the team prefers colocation, `lib/` + `components/` can be nested under `src/`; this plan keeps the existing root layout to avoid churn.

---

## 4. Phases

Conventions for the checklists: each step is a PR-sized unit; every phase ends with `npm run lint && npm run type-check && npm test && npm run build` green.

### Phase 1 - Project & Environment Setup

**Objective:** make the existing scaffold reproducible, strictly typed, linted and tested-ready, and codify conventions in `AGENTS.md`. No domain logic yet.

**Already present (reuse):** Next 15 + React 19 + TS + Tailwind v3 + ESLint 8 scaffold, `@/*` alias, `strict: true`, scripts `dev/build/start/lint/type-check`.

**To add:**

| Dependency | Why |
| --- | --- |
| `zod` (runtime) | Boundary parsing of `FormData` into the discriminated union without `as`; `z.discriminatedUnion('loanType', ...)` mirrors the type design |
| `vitest@^3`, `@vitejs/plugin-react@^5`, `vite@^7`, `jsdom` (dev) | Unit/component test runner. **Vitest is pinned to 3.x**: Vitest 5 requires `@types/node` >=22, conflicting with the Node 20 target; `vite` is listed explicitly to satisfy the plugin peer (`vite` and `jsdom` in practice need Node `^20.19`, `engines` stays `>=20`) |
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` (dev) | Component behaviour tests |
| `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` (dev) | Ban `any` and assertions |
| `prettier`, `eslint-config-prettier`, `prettier-plugin-tailwindcss` (dev) | Formatting |
| `@playwright/test` (dev) | Browser smoke test of streaming UI; installed and configured in Phase 1 (`playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `npm run test:e2e`), kept out of `verify` because it needs browser binaries (`npx playwright install --with-deps chromium`) |

Decision: use `eslint .` (not `next lint`) for the `lint` script, because `next lint` is deprecated in Next 15 and only covers `app/ components/ lib/ src/` (it would skip `types/`, `tests/` and root configs); `next build` still runs its own lint step. Stay on Tailwind v3 and ESLint 8/`.eslintrc.json` (already working with Next 15). Upgrading to Tailwind v4 / ESLint 9 flat config is out of scope and tracked as a separate follow-up.

**Steps**

- [x] 1.1 Create branch; run `npm install`; commit the generated `package-lock.json`; add `engines: { node: ">=20" }` and `.nvmrc` (`20`); update README prerequisites.
- [x] 1.2 Confirm baseline: `npm run lint`, `npm run type-check`, `npm run build` all run on the untouched scaffold; record any pre-existing failures in the PR description.
- [x] 1.3 Harden `tsconfig.json`: `target`/`lib` ES2022, remove `allowImportingTsExtensions` and `useDefineForClassFields`, add `plugins: [{ "name": "next" }]`, `incremental`, `allowJs: false`, `jsx: "preserve"` (mandatory in Next; it rewrites `react-jsx` on every build), and add `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `forceConsistentCasingInFileNames`.
- [x] 1.4 Extend `.eslintrc.json` (keep `next/core-web-vitals`, add `plugin:@typescript-eslint/strict-type-checked`, `prettier`). Required rules, all `error`: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/consistent-type-assertions` with `assertionStyle: "never"` (`as const` still allowed), `@typescript-eslint/no-non-null-assertion`, `@typescript-eslint/switch-exhaustiveness-check`, `@typescript-eslint/no-floating-promises`, `@typescript-eslint/consistent-type-imports`, `no-console` (warn). Set `parserOptions.project`. The `lint` script is `eslint . --max-warnings=0`. *Deviation:* a temporary per-file `overrides` entry relaxes four non-`any`/non-assertion rules (`no-unnecessary-condition`, `no-unsafe-assignment`, `no-misused-promises`, `no-console`) for legacy `components/Calculator.tsx`, which is deleted in 3.7; the override must be removed in that change. `LoanForm.tsx` / `RepaymentSchedule.tsx` received minimal lint fixes in Phase 1 (type guard instead of `as`, braces on a void arrow) and are rewritten in Phase 3.
- [x] 1.5 Add Prettier config and scripts: `format`, `format:check`; add `"test": "vitest run"`, `"test:watch": "vitest"`; keep `type-check`; add `"verify": "npm run lint && npm run type-check && npm test && npm run build"`; add `"test:e2e": "playwright test"` (not part of `verify`). Prettier was applied repo-wide to existing source; `docs/implementation-plan.md` is in `.prettierignore` to keep its diff to checkbox changes.
- [x] 1.6 Add `vitest.config.ts` (jsdom env for `tests/components`, node env for `tests/unit`, `@/` alias, setup file with jest-dom) and trivial passing smoke tests to prove the harness (`tests/unit/smoke.test.ts`, `tests/components/smoke.test.tsx`). Also set up Playwright: `playwright.config.ts` (chromium, `testDir: tests/e2e`, web server = `npm run build` + `next start` on port 3100) and `tests/e2e/smoke.spec.ts` (page shell renders; select fields show no focus ring).
- [x] 1.7 Fix `app/layout.tsx`: move `viewport` to `export const viewport: Viewport`; keep metadata; remove redundant global `* { margin:0; padding:0 }` from `globals.css` (Tailwind preflight already resets); extend Tailwind `content` globs to `./lib/**`, `./types/**` only if class names ever appear there (otherwise leave).
- [x] 1.8 Write **`AGENTS.md`** at the repo root (see 4.1.1 for required content).
- [x] 1.9 Create the empty target folders only where files will land in Phase 2 (`lib/`, `tests/`); do not add placeholder files. *Deviation:* `lib/` is not created in Phase 1 (git cannot track an empty folder); it appears with the first Phase 2 file. `tests/` exists via the smoke tests.
- [x] 1.10 Update `README.md` (structure, scripts, Node version, remove "implement /api/evaluate-risk", link `AGENTS.md` and this plan).

#### 4.1.1 `AGENTS.md` required content

`AGENTS.md` in the repo root is the single source of conventions for humans and coding agents (it replaces the idea of a `CLAUDE.md`; none exists in the repo, so no rename is required). It must contain these sections:

1. **Project overview** - stack, Node version, how to run `dev`, `verify`, `test`.
2. **Coding standards**
   - Server Components by default; add `'use client'` only when a hook/event handler requires it, and push the boundary as deep as possible.
   - Named exports for non-route modules; default exports only where Next requires them.
   - One component per file, PascalCase file names; utilities kebab-case.
   - No `console.*` in committed code; errors are returned as values or thrown to an error boundary.
   - Imports via `@/` alias; `import type` for types.
3. **Type rules**
   - `strict` plus the extra flags in 1.3 are mandatory.
   - **No `any`** (explicit or implicit), no `// @ts-ignore` / `@ts-expect-error` without a linked issue.
   - **No type assertions (`as T`, `<T>x`) and no non-null `!`.** Use type guards, schema parsing, `satisfies`, or exhaustive narrowing. `as const` is allowed.
   - Loan state **must** be modelled with the discriminated union on `loanType` in `types/loan.ts`; never add optional "bag of fields" interfaces for category-specific data.
   - Every `switch` over a union ends in `assertNever` (or relies on `switch-exhaustiveness-check`).
   - `unknown` for untrusted input, parsed at the boundary (`lib/validation`).
4. **Component constraints**
   - Forms use `<form action={fn}>` with Server Actions; no `onSubmit` + `preventDefault` + `fetch` for submission.
   - Pending UI comes from `useFormStatus` in a **child** of the `<form>` (e.g. `SubmitButton`), never from a parent `useState` flag.
   - Form-level state uses `useActionState`; optimistic UI uses `useOptimistic`.
   - Async data is consumed with `use()` inside a component wrapped in `<Suspense>` with a skeleton fallback and an error boundary. Promises passed to `use()` are created outside render (in an action or cache), never inside the consuming component.
   - Presentational components take already-computed props; no financial math inside components.
   - Accessibility: labelled inputs, `aria-live` for results/errors, `aria-busy` while pending.
5. **Domain rules** - money handling (round at presentation, compute in cents or with documented rounding), amortization lives only in `lib/finance`, scoring only in `lib/credit`.
6. **Testing rules** - every new `lib/*` function has a unit test; every new union variant requires a narrowing test and updated exhaustive switches.
7. **Definition of done** - `npm run verify` passes; plan checkboxes updated.
8. **Out of scope / do not** - no new dependencies without justification in the PR; no API routes for submission (Server Actions only).

**Acceptance criteria - Phase 1**

- [x] Fresh clone: `npm ci && npm run verify` succeeds (lockfile committed).
- [x] `tsc` reports zero errors with the strict flags in 1.3; the Next build emits no `viewport`-in-metadata warning.
- [x] A deliberately introduced `any`, `x as Foo`, `value!` and a non-exhaustive `switch` each fail `npm run lint` (verify locally, then remove the probe).
- [x] `npm test` runs and passes the smoke test.
- [x] `AGENTS.md` exists at the repo root and contains all 8 sections above; no `CLAUDE.md` exists; README links to `AGENTS.md`.

---

### Phase 2 - Type System & Data Layer

**Objective:** a fully typed, framework-free domain core: discriminated unions, validation, amortization math and a mock async credit assessment engine.

**Steps**

- [ ] 2.1 Create `types/loan.ts` per section 2.1: `LOAN_TYPES`, `LoanType`, `EmploymentStatus`, `LoanPurpose`, `BaseLoanApplication`, the three variants, `LoanApplication`, `RiskLevel`, `CreditAssessment`, `AssessmentError`, `AssessmentResult`, `RepaymentSummary`, `FormState`.
- [ ] 2.2 Add `lib/utils/assert-never.ts`.
- [ ] 2.3 Add a compile-time test file `tests/unit/types/loan.type-test.ts` using `expectTypeOf` (vitest) / `// @ts-expect-error` probes proving: (a) a `mortgage` literal without `downPayment` does not compile; (b) `personal` with `vehicleVin` does not compile; (c) inside `if (app.loanType === 'auto')`, `app.vehicleVin` is `string` and `app.propertyAddress` is a compile error; (d) a function with an exhaustive `switch` stops compiling when a fourth type is added to the union (documented in the test, verified manually once).
- [ ] 2.4 Delete `types/index.ts`; migrate imports (`LoanCategory` -> `LoanType`, `LoanData` -> `LoanApplication`, `RiskResult` -> `AssessmentResult`). Temporarily keep the old components compiling or stub them; Phase 3 rewrites them.
- [ ] 2.5 `lib/validation/loan-schema.ts`: `z.discriminatedUnion('loanType', [...])` for the three variants. Rules: `loanAmount` 1,000-5,000,000; `termMonths` integer within per-type range (mortgage 120-480, personal 12-84, auto 12-96); `annualIncome` > 0; `monthlyDebt` >= 0; `creditScore` integer 300-850; mortgage `downPayment` >= 0 and `< loanAmount`, non-empty trimmed `propertyAddress`; personal `loanPurpose` in enum; auto `vehicleVin` matches `^[A-HJ-NPR-Z0-9]{17}$` after upper-casing. Output type is compile-checked against `LoanApplication` via `satisfies`-style equality helper (a type-level `Equals` assertion in the type-test file, not a cast).
- [ ] 2.6 `lib/validation/parse-form-data.ts`: `parseLoanFormData(formData: FormData): ParseResult` where `ParseResult = { ok: true; application: LoanApplication } | { ok: false; fieldErrors: FieldErrors }`. Converts `FormDataEntryValue` -> primitives via `typeof === 'string'` guards and `Number()` + `Number.isFinite`; rejects `File` values; trims strings; ignores fields that do not belong to the submitted `loanType` (prevents stale hidden-field data from leaking across types).
- [ ] 2.7 `lib/finance/amortization.ts`: `monthlyPayment(principal, annualRate, termMonths)` (handles `annualRate === 0` without dividing by zero), `buildSchedule(...)` returning typed rows with a per-year rollup option, final-payment rounding correction so ending balance is exactly 0. `lib/finance/rates.ts`: base APR by `loanType` plus a risk-level adjustment. `lib/finance/summary.ts`: `computeRepaymentSummary(app)` (mortgage principal = `loanAmount - downPayment`; DTI; total interest; total cost).
- [ ] 2.8 `lib/credit/scoring.ts`: pure `scoreApplication(app): ScoreBreakdown` using a `switch (app.loanType)` for type-specific factors (mortgage: LTV from down payment; personal: purpose risk weight; auto: VIN-derived model-year heuristic from the 10th VIN character). Combines with credit score, DTI, employment. Returns score 0-100 and `RiskLevel` thresholds.
- [ ] 2.9 `lib/credit/assess-credit.ts`: `assessCredit(app: LoanApplication, options: { signal?: AbortSignal; latencyMs?: number; random?: () => number }): Promise<AssessmentResult>`.
  - Simulated latency via `lib/utils/sleep.ts` (abortable; clears its timer on abort).
  - Checks `signal.throwIfAborted()` before and after the delay; on abort resolves/rejects with a typed `AssessmentError` of kind `'aborted'` (decide in 2.9: **reject** with `AbortError` so callers can distinguish cancel from failure; documented in `errors.ts`).
  - Deterministic when `random` and `latencyMs` are injected (tests); never reads global `Math.random` directly.
  - Supports a deterministic failure path (`kind: 'service_unavailable'`) triggered by an injected `failureRate`/seed so the error UI can be tested.
- [ ] 2.10 Unit tests for 2.5-2.9 (see Phase 5 matrix for case list; the happy-path and narrowing tests land in this phase, the edge-case sweep in Phase 5).

**Acceptance criteria - Phase 2**

- [ ] `types/loan.ts` exports the union and `tsc` rejects every impossible state listed in 2.3; no `any`, no `as` anywhere under `types/` or `lib/` (lint-enforced).
- [ ] `LoanApplication` is the *only* type used for submitted loan state (grep for the old `LoanData`/`LoanCategory` returns nothing).
- [ ] `parseLoanFormData` returns `ok: false` with field-keyed errors for each invalid case and never throws on arbitrary `FormData`.
- [ ] `monthlyPayment` matches a known reference (e.g. 250,000 @ 6.5% / 360 months = 1,580.17 +/- 0.01) and `buildSchedule` ends at balance 0.
- [ ] `assessCredit` resolves within the configured latency, honours an aborted signal immediately, and is deterministic under injection.
- [ ] All Phase 2 unit tests pass; the domain layer imports nothing from `react` or `next`.

---

### Phase 3 - Form & Component Architecture

**Objective:** replace the client-side `fetch` flow with a native `<form action>` + Server Action, with type-driven conditional fields, `useFormStatus` pending UI and `useActionState` form state.

**Steps**

- [ ] 3.1 `app/actions/submit-loan-application.ts` (`'use server'`): signature `(prev: FormState, formData: FormData) => Promise<FormState>` (compatible with `useActionState`).
  - Calls `parseLoanFormData`; on failure returns `{ status: 'error', fieldErrors, submittedValues }` (so inputs are repopulated without client state).
  - On success computes `computeRepaymentSummary` synchronously, starts `assessCredit(application, { signal })` **without awaiting**, and returns `{ status: 'success', application, summary, assessment }` where `assessment` is the pending Promise (consumed in Phase 4).
  - Builds `signal` with `AbortSignal.timeout(ASSESSMENT_TIMEOUT_MS)` (named constant) so a hung engine cannot stream forever.
  - Attaches a no-op `.catch` guard only if needed to avoid unhandled-rejection noise on the server while still letting the client observe the rejection (verify in the Phase 4 spike).
  - No `try/catch` that swallows; unexpected exceptions bubble to `app/error.tsx`.
- [ ] 3.2 `components/form/SubmitButton.tsx` (`'use client'`): `const { pending } = useFormStatus()`; sets `disabled`, `aria-disabled`, and swaps label ("Calculate" -> "Calculating..."). Must be rendered as a **child** of `<form>` (documented in AGENTS.md; `useFormStatus` returns idle if called in the same component that renders the form).
- [ ] 3.3 `components/form/LoanTypeSelect.tsx`: `<select name="loanType">` options generated from `LOAN_TYPES`. Because inputs for the active type depend on the selection, use a small client component with `useState<LoanType>` whose `onChange` narrows the string via an `isLoanType(value: string): value is LoanType` type guard (no `as`). Uncontrolled inputs everywhere else.
- [ ] 3.4 `components/form/LoanTypeFields.tsx`: `switch (loanType)` rendering `MortgageFields` / `PersonalFields` / `AutoFields`, ending in `assertNever`. Inactive-type fields are **unmounted** (not hidden), so they are not submitted.
- [ ] 3.5 `components/form/CommonFields.tsx` + `FieldError.tsx`: shared numeric inputs (`inputMode`, `min`, `max`, `step` mirrored from the schema constants), `aria-invalid`, `aria-describedby` wired to `FieldError`. Replace the existing range sliders with number inputs (sliders cannot express exact values like a VIN-adjacent down payment); keep an optional slider for `creditScore` only if desired.
- [ ] 3.6 `components/LoanForm.tsx` (rewrite): `<form action={formAction}>` composing the fields + `SubmitButton`; reads `fieldErrors` from `useActionState` state; `key` the field group on `loanType` so switching type resets type-specific inputs. No `onSubmit`, no `preventDefault`.
- [ ] 3.7 `components/Calculator.tsx` (rewrite): `const [state, formAction] = useActionState(submitLoanApplication, initialFormState)`; renders `LoanForm` and `ResultsPanel`. Remove all `fetch`, `ReadableStream`, loading `useState`.
- [ ] 3.8 `components/RepaymentSchedule.tsx` (rewrite): presentational; props are `RepaymentSummary` and precomputed `ScheduleRow[]`; remove inline math and hardcoded 6.5%. Keep "Show/Hide details" as a `<details>` element (no client state needed -> can become a Server Component).
- [ ] 3.9 `components/results/RecentCalculations.tsx` (`'use client'`) with `useOptimistic`: on submit, immediately append an optimistic "Calculating <type> $<amount>..." row to the history list, reconciled with the real result when the action resolves; the optimistic entry is derived from the same parsed values, not from raw strings. If, during implementation, `useOptimistic` adds no user-visible value, drop it and record the decision in the PR (requirement says "where applicable").
- [ ] 3.10 Make `app/page.tsx` and `app/layout.tsx` Server Components (already are); delete unused flat-component code paths; add `app/error.tsx` and `app/loading.tsx`.
- [ ] 3.11 Component tests: `SubmitButton` (disabled + label while a parent form action is pending), `LoanForm` (type switch mounts/unmounts the right fields; field errors render with `aria-invalid`).

**Acceptance criteria - Phase 3**

- [ ] The form works with JavaScript disabled for the validation path (progressive enhancement: native submit posts to the Server Action and re-renders with errors).
- [ ] `grep -R "onSubmit\|preventDefault\|fetch(" components app` returns nothing related to submission.
- [ ] Selecting each loan type shows exactly its required extra fields and submitting without them yields field errors keyed to those fields; fields of the non-selected types are absent from the posted `FormData`.
- [ ] The submit button is disabled and relabelled while the action is pending, via `useFormStatus` in a child component (verified by test).
- [ ] No `as`, `any`, or `!` in `components/` or `app/` (lint).
- [ ] The repayment summary renders immediately from the action result, before the risk assessment resolves.

---

### Phase 4 - Streaming & Async Integration

**Objective:** stream the credit risk assessment into the page using React 19 `use()` under `<Suspense>`, with skeletons and a clean error/abort path.

**Steps**

- [ ] 4.0 **Spike (timeboxed):** on the installed Next 15.x, verify a Server Action can return an object containing a pending Promise that resolves on the client and is readable via `use()`. Record the Next version and result in the PR. If it fails, switch to the fallback in section 2 (keyed client promise cache + second Server Action) and note the change in this plan.
- [ ] 4.1 `components/results/RiskAssessment.tsx` (`'use client'`): props `{ assessment: Promise<AssessmentResult> }`; `const result = use(assessment)`; renders `RiskEvaluation` for `ok: true`, an inline error card for `ok: false` (exhaustive over `AssessmentError['kind']`).
- [ ] 4.2 `components/results/RiskSkeleton.tsx`: Tailwind `animate-pulse` placeholders matching the final card's layout (score ring, badge, 3 factor rows, recommendation) to avoid layout shift; `role="status"`, `aria-live="polite"`, visually-hidden "Evaluating credit risk...".
- [ ] 4.3 `components/results/ResultsPanel.tsx`: for `state.status === 'success'`, render summary + `RepaymentSchedule` immediately, then `<RiskErrorBoundary><Suspense fallback={<RiskSkeleton />}><RiskAssessment assessment={state.assessment} /></Suspense></RiskErrorBoundary>`. For `idle`/`error`, render nothing/placeholder (exhaustive `switch`).
- [ ] 4.4 `components/results/RiskErrorBoundary.tsx`: class component (the one sanctioned class) that catches a rejected promise from `use()` and renders a retry affordance (retry = resubmitting the form; no hidden state).
- [ ] 4.5 Handle resubmission: when a new submission starts, React discards the old state; confirm the previous promise's rejection/abort is not surfaced and that no stale assessment renders against new inputs (key `ResultsPanel` on a submission id included in the success state).
- [ ] 4.6 Wire the abort path end to end: server action timeout signal (3.1) -> `assessCredit` rejects with `AbortError` / typed timeout -> boundary shows "Assessment timed out" with retry. Document that browser-initiated cancellation of Server Actions is not guaranteed and that the timeout signal is the authoritative cancellation mechanism.
- [ ] 4.7 Rewrite `RiskEvaluation.tsx` as pure presentational: `RISK_STYLES: Record<RiskLevel, {...}>` (compiler-enforced exhaustiveness) replacing the `string`-typed `getRiskColor/getRiskBadgeColor`; render factors with stable keys (not array index).
- [ ] 4.8 Manual + automated pass: throttle latency to ~3 s, confirm summary is visible and the skeleton is shown during the wait, then replaced; confirm no hydration warnings and no `act` warnings in tests.
- [ ] 4.9 Remove dead code (old fetch/SSE parsing remnants) and update README "Streaming" section.

**Acceptance criteria - Phase 4**

- [ ] After submit, the repayment summary appears before the credit risk; the skeleton is visible while the assessment is pending and is replaced without layout jump.
- [ ] `use()` is called only inside a component wrapped by `<Suspense>`; the promise is created in the server action (or cache), never in render (lint/review + test).
- [ ] A rejected/aborted/timed-out assessment shows a recoverable error UI and does not blank the page or the summary.
- [ ] Submitting twice quickly never shows the first submission's assessment next to the second submission's inputs.
- [ ] `next build` succeeds and the production build streams (verified manually in `next start`).

---

### Phase 5 - Testing & Verification Checklist

**Objective:** prove correctness of edge cases and type-safety guarantees; make `npm run verify` the gate.

#### 5.1 Edge-case matrix

**AbortSignal handling** (`tests/unit/credit/assess-credit.test.ts`, fake timers)
- [ ] Signal already aborted before call -> rejects immediately with `AbortError`, engine does no work.
- [ ] Signal aborted mid-delay -> rejects promptly (not after full latency); the sleep timer is cleared (assert no pending timers).
- [ ] Signal aborted after completion -> result unchanged, no unhandled rejection.
- [ ] `AbortSignal.timeout(n)` shorter than latency -> rejects with `TimeoutError`/typed timeout; longer -> resolves.
- [ ] Custom abort `reason` is preserved on the rejection.
- [ ] No `unhandledRejection` events emitted in any of the above (listener on `process`).
- [ ] UI: aborted/timeout path renders the error card (component test).

**Invalid inputs** (`tests/unit/validation/parse-form-data.test.ts`, table-driven)
- [ ] Missing `loanType`; unknown `loanType` (`'student'`); `loanType` with wrong case (`'Mortgage'`).
- [ ] Mortgage: missing/blank `propertyAddress`; missing `downPayment`; `downPayment >= loanAmount`; negative `downPayment`.
- [ ] Personal: missing or unknown `loanPurpose`.
- [ ] Auto: VIN too short/long, contains `I`, `O` or `Q`, lowercase (accepted after normalisation), whitespace padding.
- [ ] Numerics: empty string, `"abc"`, `NaN`, `Infinity`, `-1`, `0`, decimals where integers required, exponent form (`"1e9"`), values at/just beyond each min/max, `creditScore` 299/300/850/851.
- [ ] Term outside the per-type range (e.g. auto 120 months).
- [ ] `File` supplied for a text field; duplicated keys in `FormData`; extra unknown keys ignored.
- [ ] Cross-type leakage: `loanType=personal` plus a stray `vehicleVin` -> parsed object has no `vehicleVin`.
- [ ] Zero interest edge: `annualRate = 0` produces `principal / term`, no `NaN`/`Infinity`.
- [ ] Very large principal/term does not overflow display formatting (`Intl.NumberFormat`).
- [ ] Server Action returns `status: 'error'` (never throws) for all of the above; submitted values are echoed back.

**Type-narrowing checks** (`tests/unit/types/loan.type-test.ts`, run via `vitest --typecheck` and `tsc --noEmit`)
- [ ] Impossible-state probes with `// @ts-expect-error` (each must *fail* to compile, otherwise `tsc` reports an unused directive): mortgage without `downPayment`; personal with `vehicleVin`; auto with `propertyAddress`; `loanType: 'boat'`.
- [ ] Narrowing: within each `case`, variant-only fields are accessible and others are errors; type of `app` in `default` is `never`.
- [ ] `expectTypeOf<ParsedFromSchema>().toEqualTypeOf<LoanApplication>()` - schema output and hand-written union stay in sync.
- [ ] `FormState` narrowing by `status`: `assessment` only accessible when `status === 'success'`.
- [ ] Exhaustiveness: temporarily add a fourth `LoanType`; `tsc` must fail at `LoanTypeFields`, `scoring`, `rates`, `summary`, `parse` (manual, documented once in the PR).
- [ ] Repo-wide static guards: `rg -n "\bany\b|\bas (?!const)\w|!\." app components lib types` has no matches in source (CI step or lint).

**Other regression tests**
- [ ] `monthlyPayment` reference values (including 0% rate, 1-month term); schedule sums: sum(principal) == loan principal (to the cent), ending balance 0.
- [ ] `scoreApplication`: monotonic in credit score; each loan type's special factor changes the result; thresholds map to `low/medium/high` at the boundaries.
- [ ] `SubmitButton` pending state; `LoanForm` field-switching; `RiskAssessment` with a resolved, rejected and never-resolving promise inside `Suspense` (skeleton shown for the latter).
- [ ] `RecentCalculations` optimistic row appears immediately and is replaced/removed on completion or failure.
- [ ] (Optional) Playwright smoke: submit each loan type with valid data; summary appears, then risk result; invalid VIN shows inline error.

#### 5.2 Verification checklist (release gate)

- [ ] `npm run lint` clean (type-aware rules on).
- [ ] `npm run type-check` clean.
- [ ] `npm test` clean, with coverage on `lib/` >= 90% lines/branches.
- [ ] `npm run build` clean; no warnings about metadata/viewport or client/server boundary violations.
- [ ] Manual: throttled network + slow assessment shows skeleton; JS-disabled submit still validates; keyboard-only completion; screen-reader announcement of pending and result via `aria-live`.
- [ ] Manual: submit all three loan types back to back; no stale data or cross-type fields.
- [ ] README and `AGENTS.md` reflect the final structure; this plan's checkboxes are updated.

**Acceptance criteria - Phase 5**

- [ ] Every item in 5.1 has a corresponding test or documented manual check, and all automated ones pass in CI.
- [ ] `npm run verify` passes from a clean checkout (`npm ci`).
- [ ] Zero occurrences of `any`, `as <Type>` and `!` non-null assertions in source (excluding `as const`).
- [ ] A reviewer can follow the README to run the app and observe: native form submit, pending button, immediate summary, skeleton, streamed risk result, and the error/timeout state.

---

## 5. Cross-phase roadmap (condensed)

- [x] **P1** Setup: lockfile, tsconfig/ESLint hardening, test harness, `AGENTS.md`, README
- [ ] **P2** Types & data: `types/loan.ts`, schema + `parseLoanFormData`, finance, mock `assessCredit`, unit tests
- [ ] **P3** Forms: Server Action, `SubmitButton` (`useFormStatus`), conditional fields, `useActionState`, `useOptimistic`, rewrite flat components
- [ ] **P4** Streaming: spike, `use()` + `<Suspense>` + skeleton + error boundary, abort/timeout path
- [ ] **P5** Testing: edge-case matrix, type-narrowing tests, verification gate

Suggested PR slicing: P1 (1 PR), P2 (types+validation PR, then finance+credit PR), P3 (1-2 PRs), P4 (1 PR), P5 (tests land with each phase; final PR closes remaining matrix items and coverage gate).

## 6. Risks and open questions

| Risk / question | Mitigation |
| --- | --- |
| Promise-returning Server Actions may not serialize on a given Next 15.x patch | Phase 4.0 spike + documented fallback (keyed promise cache + second action) |
| Browser-side cancellation of in-flight Server Actions is limited | Treat server-side `AbortSignal.timeout` as authoritative; test the engine directly with signals |
| `strict-type-checked` ESLint on Next/React types can be noisy | Tune per-rule in `.eslintrc.json`, never disable the `any`/assertion rules |
| `zod` inference vs. hand-written union drift | Type-level equality test (5.1) |
| `useOptimistic` may add little for a single-shot calculator | Scope it to the "recent calculations" list; drop with a recorded rationale if not valuable |
| Money precision | Compute in floating point only inside `lib/finance`, round at presentation; consider integer cents if rounding tests expose drift |
| Mock engine is not a real credit model | UI copy must label results as illustrative; no PII persisted |
| ESLint 8 / Tailwind 3 are aging | Out of scope; separate upgrade PR |
