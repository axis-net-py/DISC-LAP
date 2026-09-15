import { readFile } from 'node:fs/promises';
import { describe,expect,it } from 'vitest';

describe('production security headers',()=>{
  it('protects every page against injection, framing, downgrade, and data leakage',async()=>{
    const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
    const headers=Object.fromEntries(config.headers[0].headers.map(({key,value})=>[key.toLowerCase(),value]));
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['strict-transport-security']).toContain('max-age=63072000');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
  });
});
