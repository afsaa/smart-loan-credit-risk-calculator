'use client';

import { useState } from 'react';
import LoanForm from './LoanForm';
import RiskEvaluation from './RiskEvaluation';
import RepaymentSchedule from './RepaymentSchedule';
import type { LoanData, RiskResult } from '@/types';

export default function Calculator() {
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (data: LoanData) => {
    setLoanData(data);
    setLoading(true);
    setRiskResult(null);

    try {
      const response = await fetch('/api/evaluate-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to evaluate risk');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let result: RiskResult = {
        score: 0,
        level: 'unknown',
        factors: [],
        recommendation: '',
      };

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              result = { ...result, ...data };
              setRiskResult({ ...result });
            } catch (e) {
              console.error('Failed to parse stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error evaluating risk:', error);
      setRiskResult({
        score: 0,
        level: 'error',
        factors: [],
        recommendation: 'An error occurred while evaluating your risk. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Loan Information
        </h2>
        <LoanForm onCalculate={handleCalculate} isLoading={loading} />
      </div>

      <div className="space-y-8">
        {loading && (
          <div className="bg-blue-50 rounded-lg shadow p-8 text-center">
            <p className="text-blue-900">Evaluating your credit risk...</p>
          </div>
        )}

        {riskResult && !loading && (
          <>
            <RiskEvaluation result={riskResult} />
            {loanData && <RepaymentSchedule loanData={loanData} />}
          </>
        )}
      </div>
    </div>
  );
}
