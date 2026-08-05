import { describe, expect, it } from 'vitest';
import { pickBestPainterApplication } from './painterApplication';

const applications = [
  {
    id: 'older-email-match',
    email: 'pintor@example.com',
    status: 'pending',
    auth_user_id: null
  },
  {
    id: 'accepted-email-match',
    email: 'PINTOR@example.com',
    status: 'accepted',
    auth_user_id: null
  },
  {
    id: 'user-id-match',
    email: 'other@example.com',
    status: 'pending',
    auth_user_id: 'user-1'
  },
  {
    id: 'accepted-user-id-match',
    email: 'another@example.com',
    status: 'accepted',
    auth_user_id: 'user-1'
  }
];

describe('pickBestPainterApplication', () => {
  it('prioritizes accepted records for the authenticated user', () => {
    expect(pickBestPainterApplication(applications, 'pintor@example.com', 'user-1')?.id)
      .toBe('accepted-user-id-match');
  });

  it('falls back to an accepted email match when no user id matches', () => {
    expect(pickBestPainterApplication(applications, 'pintor@example.com', 'user-2')?.id)
      .toBe('accepted-email-match');
  });

  it('returns null for an empty list', () => {
    expect(pickBestPainterApplication([], 'pintor@example.com')).toBeNull();
  });
});
