import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config.js';

describe('readConfig', () => {
  it('rejects missing production secrets instead of booting insecurely', () => {
    expect(() => readConfig({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/);
  });

  it('parses a complete environment and applies the retention default', () => {
    const config = readConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://app:secret@db.example/disc',
      ADMIN_PASSWORD_HASH: '$2b$12$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl',
      SESSION_SECRET: 'a'.repeat(48)
    });

    expect(config).toEqual({
      nodeEnv: 'production',
      databaseUrl: 'postgres://app:secret@db.example/disc',
      adminPasswordHash: '$2b$12$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl',
      sessionSecret: 'a'.repeat(48),
      retentionDays: 730
    });
  });

  it('rejects weak session secrets', () => {
    expect(() => readConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://app:secret@db.example/disc',
      ADMIN_PASSWORD_HASH: '$2b$12$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl',
      SESSION_SECRET: 'short'
    })).toThrow(/SESSION_SECRET/);
  });
});
