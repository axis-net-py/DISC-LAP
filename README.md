# DISC-LAP

Plataforma bilíngue de avaliação comportamental DISC para uso empresarial.

## Desenvolvimento

```bash
npm install
npm test
npm run lint
npm run build
```

Copie `.env.example` para o provedor de hospedagem e configure segredos reais. Nunca envie o arquivo `.env` ao GitHub.

## Produção

- Execute `db/migrations/001_create_assessments.sql` no PostgreSQL.
- Configure as quatro variáveis descritas em `.env.example`.
- Acesse o painel protegido em `/admin/`.
- Consulte `docs/operations.md` para implantação, retenção, backup e resposta a incidentes.

O resultado representa intensidade dentro deste questionário de autorrelato; não é percentil populacional, diagnóstico psicológico ou instrumento declarado como validado psicometricamente.
