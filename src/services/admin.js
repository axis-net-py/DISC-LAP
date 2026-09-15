import { z } from 'zod';

export class AdminError extends Error{constructor(status,message){super(message);this.name='AdminError';this.status=status;}}
const querySchema=z.object({page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(100).catch(100),search:z.string().trim().max(120).default(''),country:z.enum(['BR','PY']).optional(),from:z.string().date().optional(),to:z.string().date().optional()});
const csvCell=(value)=>{const string=String(value??'');const safe=/^[=+\-@]/.test(string)?`'${string}`:string;return `"${safe.replaceAll('"','""')}"`;};
export function createAdminService({repository}){return{
  async list(query){const parsed=querySchema.parse(query);const result=await repository.list(parsed);return{...result,page:parsed.page,pageSize:parsed.pageSize};},
  async detail(id){const item=await repository.findById(id);if(!item)throw new AdminError(404,'Resultado não encontrado.');return item;},
  async remove(id){if(!await repository.softDelete(id))throw new AdminError(404,'Resultado não encontrado.');return{deleted:true};},
  async exportCsv(query){const parsed=querySchema.parse(query);const rows=await repository.exportRows(parsed);const header='Data,Nome,WhatsApp,País,Perfil,D,I,S,C';const lines=rows.map((row)=>[row.completedAt,row.name,row.phone,row.country,row.profile,row.intensity.D,row.intensity.I,row.intensity.S,row.intensity.C].map(csvCell).join(','));return `\uFEFF${[header,...lines].join('\n')}\n`;}
};}
