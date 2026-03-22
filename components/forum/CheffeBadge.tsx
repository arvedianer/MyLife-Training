'use client';

// Utility functions for displaying Cheffe badge
// Usage: <span style={{ color: cheffeColor(role) || colors.textPrimary }}>{displayUsername(username, role)}</span>

import { colors } from '@/constants/tokens';

export function displayUsername(username: string, role?: string | null): string {
  return role === 'cheffe' ? `👑 ${username}` : username;
}

export function cheffeColor(role?: string | null): string {
  return role === 'cheffe' ? colors.cheffe : '';
}
