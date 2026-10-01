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
- **Node**: v18+

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
npm install
```

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
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── api/               # API routes (to be added)
├── components/            # React components
│   ├── Calculator.tsx     # Main calculator component
│   ├── LoanForm.tsx       # Loan input form
│   ├── RiskEvaluation.tsx # Risk display component
│   └── RepaymentSchedule.tsx # Schedule display
├── types/                 # TypeScript type definitions
│   └── index.ts
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## Development

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Next Steps

- Implement the `/api/evaluate-risk` endpoint for streaming risk evaluation
- Add more sophisticated risk calculation algorithms
- Integrate with real financial data sources
- Add user persistence with database
- Implement authentication

## License

MIT
