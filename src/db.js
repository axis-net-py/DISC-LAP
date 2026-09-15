import pg from 'pg';

let pool;

export function getPool(connectionString) {
  if (!pool) pool = new pg.Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 });
  return pool;
}

export function createAssessmentRepository(database) {
  const mapRow = (row) => row && ({
    id: row.id,
    idempotencyKey: row.idempotency_key,
    participant: { name: row.participant_name, phone: row.phone_e164, country: row.country },
    locale: row.locale,
    consentAt: row.consent_at.toISOString(),
    scores: row.scores,
    profile: row.profile,
    whatsappUrl: row.whatsapp_url,
    completedAt: row.completed_at.toISOString()
  });

  return {
    async findByIdempotencyKey(key) {
      const { rows } = await database.query('SELECT * FROM assessments WHERE idempotency_key = $1 LIMIT 1', [key]);
      return mapRow(rows[0]);
    },
    async insert(record) {
      const { rows } = await database.query(
        `INSERT INTO assessments
          (idempotency_key, participant_name, phone_e164, country, locale, consent_at, scores, profile, whatsapp_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
         RETURNING *`,
        [record.idempotencyKey, record.participant.name, record.participant.phone, record.participant.country,
          record.locale, record.consentAt, record.scores, record.profile, record.whatsappUrl]
      );
      return mapRow(rows[0]);
    }
  };
}

const adminRow=(row)=>({id:row.id,completedAt:row.completed_at.toISOString(),name:row.participant_name,phone:row.phone_e164,country:row.country,locale:row.locale,profile:row.profile?.primary?.name||'',intensity:row.scores?.intensity||{},scores:row.scores,report:row.profile,consentAt:row.consent_at.toISOString()});
function whereClause(filters){const values=[],clauses=['deleted_at IS NULL'];if(filters.search){values.push(`%${filters.search}%`);clauses.push(`(participant_name ILIKE $${values.length} OR phone_e164 ILIKE $${values.length})`);}if(filters.country){values.push(filters.country);clauses.push(`country = $${values.length}`);}if(filters.from){values.push(filters.from);clauses.push(`completed_at >= $${values.length}::date`);}if(filters.to){values.push(filters.to);clauses.push(`completed_at < ($${values.length}::date + interval '1 day')`);}return{sql:clauses.join(' AND '),values};}
export function createAdminRepository(database){return{
  async list(filters){const where=whereClause(filters),offset=(filters.page-1)*filters.pageSize;const [items,count]=await Promise.all([database.query(`SELECT * FROM assessments WHERE ${where.sql} ORDER BY completed_at DESC LIMIT $${where.values.length+1} OFFSET $${where.values.length+2}`,[...where.values,filters.pageSize,offset]),database.query(`SELECT count(*)::int AS total FROM assessments WHERE ${where.sql}`,where.values)]);return{items:items.rows.map(adminRow),total:count.rows[0].total};},
  async findById(id){const {rows}=await database.query('SELECT * FROM assessments WHERE id=$1 AND deleted_at IS NULL LIMIT 1',[id]);return rows[0]?adminRow(rows[0]):null;},
  async softDelete(id){const {rowCount}=await database.query('UPDATE assessments SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL',[id]);return rowCount===1;},
  async exportRows(filters){const where=whereClause(filters);const {rows}=await database.query(`SELECT * FROM assessments WHERE ${where.sql} ORDER BY completed_at DESC LIMIT 10000`,where.values);return rows.map(adminRow);}
};}
