// constants/chatFilter.ts
// Words blocked in General Chat for all users
// Cheffe can post anything (enforced client-side)
export const BLOCKED_WORDS: string[] = [
  'nword', 'fick', 'scheiß', 'hurensohn', 'wichser',
];

export function containsBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}
