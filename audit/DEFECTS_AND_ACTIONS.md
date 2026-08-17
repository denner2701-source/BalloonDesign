# Defeitos e ações

## Produção atual

| ID | Severidade | Defeito | Estado |
|---|---|---|---|
| PROD-001 | P1 | Erro fatal `supabase` redeclarado | aberto na produção antiga |
| PROD-002 | P1 | Interface administrativa acessível sem autenticação comprovada | aberto na produção antiga |
| PROD-003 | P1 | Controles fantasmas (`Novo Projeto`, logout e ações sem efeito) | aberto na produção antiga |
| PROD-004 | P2 | Rotas de recuperação, planos e configurações em 404 | aberto na produção antiga |
| PROD-005 | P2 | Status Vercel/Supabase apresentado como texto fixo, não monitoramento real | aberto na produção antiga |
| PROD-006 | P2 | Tailwind CDN em produção | aberto na produção antiga |
| PROD-007 | P2 | Dados recentes aparentam ser demonstrações estáticas | aberto na produção antiga |

## Candidato local

| ID | Severidade | Defeito | Correção / estado |
|---|---|---|---|
| RC-001 | P3 | Acentos viravam hífens em nomes exportados | corrigido e coberto por teste |
| RC-002 | P3 | CSV expunha imprecisão binária | corrigido e coberto por teste |
| RC-003 | P4 | `1 balões` | corrigido e retestado |
| RC-004 | P2 | Canvas sem operação por teclado | corrigido e retestado |
| RC-005 | P3 | Três controles sem nome acessível explícito | corrigido |
| RC-006 | P2 | Grants `TRUNCATE/TRIGGER/REFERENCES` desnecessários | corrigido por migração |
| RC-007 | P2 | Projeto/paleta importados sem normalização suficiente | corrigido |
| RC-008 | P2 | Auth e isolamento entre usuários sem evidência real | pendente; exige 2 contas QA |
| RC-009 | P3 | Impressão/PDF sem artefato capturado | pendente em ambiente físico |
| RC-010 | P3 | `vendor.js` de 945 KB antes de compressão | melhoria futura; medir após deploy |

Não há P0 conhecido no candidato local. A produção antiga possui P1 abertos e não deve receber aprovação.
