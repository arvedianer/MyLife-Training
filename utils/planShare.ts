import type { TrainingSplit } from '@/types/splits';

export function encodePlan(split: TrainingSplit): string {
  return btoa(encodeURIComponent(JSON.stringify(split)));
}

export function decodePlan(encoded: string): TrainingSplit | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as TrainingSplit;
  } catch {
    return null;
  }
}
