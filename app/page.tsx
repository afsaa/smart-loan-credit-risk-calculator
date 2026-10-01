import Calculator from '@/components/Calculator';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
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
