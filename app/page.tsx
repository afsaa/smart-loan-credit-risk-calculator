import Calculator from '@/components/Calculator';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Smart Loan & Credit Risk Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Get instant credit risk evaluation and dynamic repayment schedules
          </p>
        </header>
        <Calculator />
      </div>
    </div>
  );
}
