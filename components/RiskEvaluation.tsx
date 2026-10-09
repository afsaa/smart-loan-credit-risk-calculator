import type { CreditAssessment, RiskLevel } from '@/types/loan';

interface RiskEvaluationProps {
  assessment: CreditAssessment;
}

const RISK_STYLES = {
  low: { card: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' },
  medium: { card: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' },
  high: { card: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800' },
} as const satisfies Record<RiskLevel, { card: string; badge: string }>;

export default function RiskEvaluation({ assessment }: RiskEvaluationProps) {
  const styles = RISK_STYLES[assessment.level];

  return (
    <div className={`rounded-lg border-2 p-8 shadow ${styles.card}`}>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900">Credit Risk Evaluation</h2>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-2 text-sm text-gray-600">Risk Score</p>
          <p className="text-5xl font-bold text-gray-900">{assessment.score}</p>
        </div>
        <div>
          <span
            className={`rounded-full px-4 py-2 text-lg font-semibold uppercase ${styles.badge}`}
          >
            {assessment.level}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Risk Factors</h3>
        <ul className="space-y-2">
          {assessment.factors.map((factor, index) => (
            <li key={factor.id} className="flex items-start">
              <span className="mr-3 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-700">
                {index + 1}
              </span>
              <span className="text-gray-700">{factor.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-white bg-opacity-50 p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Recommendation</h3>
        <p className="text-gray-700">{assessment.recommendation}</p>
        <p className="mt-2 text-xs text-gray-500">
          Illustrative result from a mock model; not a real credit decision.
        </p>
      </div>
    </div>
  );
}
