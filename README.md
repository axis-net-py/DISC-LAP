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

## Questionário canônico (v3, paridade com o teste manual)

- 10 grupos x 4 adjetivos, ordem fixa [D, I, S, C], idênticos ao PDF manual.
- Resposta ipsativa: cada grupo usa 1, 2, 3 e 4 exatamente uma vez (4 = mais se parece, 1 = menos se parece).
- SOMA por coluna: 10–40 por dimensão; `POST /api/assessments` exige `answers` como Array(10) de [notaD, notaI, notaS, notaC].
- Quebra intencional da v2 (24 afirmações Likert): submissões antigas são rejeitadas com `São necessários 10 grupos`.
