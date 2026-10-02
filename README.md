# Smart Loan & Credit Risk Calculator

An interactive financial tool where users input financial data, select a loan category (**Mortgage**, **Personal**, or **Auto**), and receive a streamed credit risk evaluation alongside a dynamic repayment schedule.

## Features

- 📊 **Credit Risk Evaluation**: Streamed risk assessment based on financial data
- 💰 **Loan Categories**: Support for Mortgage, Personal, and Auto loans
- 📅 **Dynamic Repayment Schedule**: Visual and interactive payment breakdown
- 🎨 **Modern UI**: Built with React 19, Next.js, and Tailwind CSS
- ⚡ **Type-Safe**: Full TypeScript support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Node**: v20+
- **Validation**: Zod
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 20 or higher (see `.nvmrc`)
- npm

### Installation

```bash
npm ci
```

`.npmrc` pins this repo to the public npm registry, so a user-level private registry does not intercept the install.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
.
├── AGENTS.md              # Coding standards, type rules, component constraints
├── app/                   # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Calculator.tsx     # Main calculator component
│   ├── LoanForm.tsx       # Loan input form
│   ├── RiskEvaluation.tsx # Risk display component
│   └── RepaymentSchedule.tsx # Schedule display
├── types/                 # TypeScript type definitions
│   └── index.ts
├── tests/                 # Vitest tests (unit/ in node, components/ in jsdom)
├── docs/
│   └── implementation-plan.md # Phased implementation plan
├── vitest.config.ts       # Test runner configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

The target structure (`lib/`, `components/form/`, `components/results/`, Server Actions) is described in
[`docs/implementation-plan.md`](docs/implementation-plan.md) and is added phase by phase.

## Development

Conventions for contributors and coding agents are in [`AGENTS.md`](AGENTS.md).

| Script                                    | Purpose                                                      |
| ----------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                             | Start the dev server                                         |
| `npm run lint`                            | ESLint (type-aware, strict)                                  |
| `npm run type-check`                      | `tsc --noEmit`                                               |
| `npm test`                                | Run unit and component tests (`npm run test:watch` to watch) |
| `npm run format` / `npm run format:check` | Prettier                                                     |
| `npm run verify`                          | Lint + type-check + test + build (the release gate)          |

## Next Steps

Work is tracked phase by phase in [`docs/implementation-plan.md`](docs/implementation-plan.md):
type system and data layer, Server Action forms, streamed risk assessment (React 19 `use()` +
`<Suspense>`), and the testing/verification checklist.

## License

MIT
