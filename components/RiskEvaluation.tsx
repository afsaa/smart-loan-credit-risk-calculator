'use client';

import type { RiskResult } from '@/types';

interface RiskEvaluationProps {
  result: RiskResult;
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'low':
      return 'bg-green-50 border-green-200';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200';
    case 'high':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getRiskBadgeColor = (level: string) => {
  switch (level) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RiskEvaluation({ result }: RiskEvaluationProps) {
  return (
    <div className={`rounded-lg border-2 p-8 shadow ${getRiskColor(result.level)}`}>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900">Credit Risk Evaluation</h2>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-2 text-sm text-gray-600">Risk Score</p>
          <p className="text-5xl font-bold text-gray-900">{result.score.toFixed(1)}</p>
        </div>
        <div>
          <span
            className={`rounded-full px-4 py-2 text-lg font-semibold uppercase ${getRiskBadgeColor(
              result.level,
            )}`}
          >
            {result.level}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Risk Factors</h3>
        <ul className="space-y-2">
          {result.factors.map((factor, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-3 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-700">
                {index + 1}
              </span>
              <span className="text-gray-700">{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-white bg-opacity-50 p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Recommendation</h3>
        <p className="text-gray-700">{result.recommendation}</p>
      </div>
    </div>
  );
}
