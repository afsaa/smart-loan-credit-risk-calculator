import type { FieldErrors, LoanApplication, LoanFieldName } from '@/types/loan';
import { isLoanType } from '@/lib/validation/guards';
import {
  isLoanFieldName,
  loanApplicationSchema,
  loanFieldsFor,
} from '@/lib/validation/loan-schema';

export type ParseResult =
  { ok: true; application: LoanApplication } | { ok: false; fieldErrors: FieldErrors };

type MutableFieldErrors = { [K in LoanFieldName]?: string[] };

type TextEntry = { ok: true; value: string | undefined } | { ok: false; message: string };

function readTextEntry(formData: FormData, name: string): TextEntry {
  const entries = formData.getAll(name);
  if (entries.length > 1) {
    return { ok: false, message: 'Provide a single value' };
  }
  const [entry] = entries;
  if (entry === undefined) {
    return { ok: true, value: undefined };
  }
  if (typeof entry !== 'string') {
    return { ok: false, message: 'Must be text, not a file' };
  }
  return { ok: true, value: entry.trim() };
}

function addError(errors: MutableFieldErrors, field: LoanFieldName, message: string): void {
  const existing = errors[field];
  if (existing === undefined) {
    errors[field] = [message];
  } else {
    existing.push(message);
  }
}

/**
 * Parses untrusted `FormData` into a `LoanApplication`. Only the fields belonging to the submitted
 * `loanType` are read, so stale inputs of other loan types never leak into the result.
 * Never throws.
 */
export function parseLoanFormData(formData: FormData): ParseResult {
  const loanTypeEntry = readTextEntry(formData, 'loanType');
  if (!loanTypeEntry.ok) {
    return { ok: false, fieldErrors: { loanType: [loanTypeEntry.message] } };
  }
  const loanType = loanTypeEntry.value;
  if (!isLoanType(loanType)) {
    return { ok: false, fieldErrors: { loanType: ['Select a loan type'] } };
  }

  const fieldErrors: MutableFieldErrors = {};
  const raw: Record<string, string> = {};
  for (const field of loanFieldsFor(loanType)) {
    const entry = readTextEntry(formData, field);
    if (!entry.ok) {
      addError(fieldErrors, field, entry.message);
    } else if (entry.value !== undefined) {
      raw[field] = entry.value;
    }
  }

  const parsed = loanApplicationSchema.safeParse(raw);
  if (parsed.success) {
    return Object.keys(fieldErrors).length === 0
      ? { ok: true, application: parsed.data }
      : { ok: false, fieldErrors };
  }

  const unreadable = new Set(Object.keys(fieldErrors));
  for (const issue of parsed.error.issues) {
    const [field] = issue.path;
    if (field !== undefined && isLoanFieldName(field) && !unreadable.has(field)) {
      addError(fieldErrors, field, issue.message);
    }
  }
  return { ok: false, fieldErrors };
}
