# Operação do DISC-LAP

## Implantação inicial

1. Crie um PostgreSQL compatível e execute `db/migrations/001_create_assessments.sql`.
2. Gere uma senha administrativa forte e converta-a em hash bcrypt:
   `node -e "import('bcryptjs').then(({hash})=>hash(process.argv[1],12).then(console.log))" 'SENHA'`
3. Gere `SESSION_SECRET` com pelo menos 48 caracteres aleatórios.
4. Configure `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` e `DATA_RETENTION_DAYS` no ambiente Production da Vercel.
5. Implante e valide uma submissão BR, uma PY, acesso ao `/admin/`, exportação e exclusão lógica.

Nunca grave a senha, a URL real do banco ou o segredo de sessão no repositório.

## Entrega por WhatsApp

Esta versão abre `wa.me` no número normalizado do participante, com a mensagem pronta. O participante precisa confirmar o envio. Envio silencioso ou automático exige WhatsApp Cloud API, consentimento e, conforme o caso, template aprovado.

## Retenção e exclusão

`DATA_RETENTION_DAYS` define a política aprovada pela empresa. A exclusão individual no painel é lógica e imediata para consultas normais. Agende a remoção definitiva abaixo conforme a política interna:

```sql
DELETE FROM assessments
WHERE completed_at < now() - make_interval(days => :retention_days)
   OR deleted_at < now() - interval '30 days';
```

Antes da remoção definitiva, confirme as obrigações legais e contratuais. Registre a execução sem incluir nomes ou telefones nos logs.

## Backup e restauração

- Ative backups automáticos e recuperação point-in-time no provedor PostgreSQL.
- Teste restauração trimestralmente em banco isolado.
- Restrinja `DATABASE_URL` aos ambientes necessários e rotacione após qualquer suspeita de exposição.

## Resposta a incidentes

1. Pause a implantação afetada.
2. Rotacione `SESSION_SECRET`, senha administrativa e credenciais do banco.
3. Revogue sessões, avalie o intervalo e a quantidade de registros atingidos.
4. Preserve evidências técnicas sem copiar dados pessoais desnecessários.
5. Siga o procedimento legal aplicável à empresa e aos titulares.

## Reversão

Reimplante o commit anterior na Vercel. As migrações são aditivas; não apague a tabela durante rollback da aplicação. Confirme compatibilidade antes de qualquer alteração destrutiva no banco.

## Questionário v3 (paridade com o manual)

- 10 grupos ipsativos [D, I, S, C] com os adjetivos do PDF; cada grupo exige 1–4 sem repetir.
- Sem migração de banco (`scores`/`profile` são `jsonb`); registros v2 continuam legíveis no painel, mas não são comparáveis 1:1.
- Validação de fumaça pós-deploy: 1 submissão BR + 1 PY com 10 grupos válidos e 1 grupo com repetição rejeitado (400).
