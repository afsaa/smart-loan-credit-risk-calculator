import type { Vin } from '@/types/loan';

export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function normalizeVin(value: string): string {
  return value.trim().toUpperCase();
}

/** Checks an already-normalised string; use `toVin` for raw input. */
export function isVin(value: string): value is Vin {
  return VIN_PATTERN.test(value);
}

export function toVin(value: string): Vin | null {
  const normalized = normalizeVin(value);
  return isVin(normalized) ? normalized : null;
}
