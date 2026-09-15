import { describe, expect, it } from 'vitest';
import { hashSync } from 'bcryptjs';
import { createSessionToken, verifySessionToken, verifyAdminPassword } from '../src/auth.js';
import { createAdminService } from '../src/services/admin.js';

const secret='s'.repeat(48);

describe('admin authentication',()=>{
  it('creates a short-lived signed session and rejects tampering',async()=>{
    const token=await createSessionToken(secret,{now:1_789_472_000});
    await expect(verifySessionToken(token,secret,{now:1_789_472_100})).resolves.toMatchObject({role:'admin'});
    await expect(verifySessionToken(`${token}tampered`,secret,{now:1_789_472_100})).rejects.toThrow();
  });
  it('verifies the configured bcrypt hash without storing plaintext',async()=>{
    const hash=hashSync('correct horse battery staple',4);
    await expect(verifyAdminPassword('correct horse battery staple',hash)).resolves.toBe(true);
    await expect(verifyAdminPassword('wrong password',hash)).resolves.toBe(false);
  });
});

describe('corporate administration',()=>{
  const row={id:'id-1',completedAt:'2026-09-15T12:00:00Z',name:'=HYPERLINK("bad")',phone:'+595981234567',country:'PY',profile:'Dominancia',intensity:{D:80,I:50,S:30,C:20}};
  const repository={list:async()=>({items:[row],total:1}),findById:async(id)=>id==='id-1'?row:null,softDelete:async(id)=>id==='id-1',exportRows:async()=>[row]};
  it('caps pagination and forwards safe filters',async()=>{
    const service=createAdminService({repository});
    const result=await service.list({page:'1',pageSize:'500',search:' Ana ',country:'PY'});
    expect(result.total).toBe(1);expect(result.pageSize).toBe(100);
  });
  it('returns not found for unknown details and deletion',async()=>{
    const service=createAdminService({repository});
    await expect(service.detail('missing')).rejects.toMatchObject({status:404});
    await expect(service.remove('missing')).rejects.toMatchObject({status:404});
  });
  it('neutralizes spreadsheet formulas in CSV exports',async()=>{
    const csv=await createAdminService({repository}).exportCsv({});
    expect(csv).toContain("'=HYPERLINK");
    expect(csv.startsWith('\uFEFFData,Nome,WhatsApp')).toBe(true);
  });
});
