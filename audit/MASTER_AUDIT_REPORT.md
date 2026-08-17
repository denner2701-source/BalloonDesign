# Auditoria, correção e homologação end-to-end

Data: 17/08/2026  
Referência funcional (somente leitura): `https://decorabalao.com.br/`  
Sistema auditado: `https://balloon-design.vercel.app/`  
Candidato corrigido: `http://127.0.0.1:4173/` no workspace local

## Decisão executiva

**Produção atual: REPROVADA PARA PRODUÇÃO.** Ela ainda serve o commit antigo `ef25de83a565c27053b046223d2345a7f6b2bfcf`, apresenta erro JavaScript fatal de redeclaração de `supabase`, controles fantasmas, páginas 404 e uma interface administrativa acessível sem comprovação de autenticação.

**Candidato local corrigido: AUDITORIA INCONCLUSIVA PARA LIBERAÇÃO.** Os fluxos locais, cálculos, persistência, exportações, responsividade e navegação passaram. A liberação depende de: publicar o candidato, repetir a suíte no domínio final, testar Auth/RLS com duas contas reais e homologar impressão/PDF e recuperação de senha com entrega de e-mail.

Os papéis dos sistemas não foram invertidos. Nenhuma escrita, duplicação, criação de projeto, pagamento ou mudança de preferência foi feita no Decora Balão.

## Escopo e ambientes

| Ambiente | Identificação | Estado observado |
|---|---|---|
| Referência | `decorabalao.com.br` | Conta autenticada; navegação funcional; zero erros de console nas telas visitadas |
| Produção auditada | `balloon-design.vercel.app` | Vercel READY, porém conteúdo antigo e defeituoso |
| GitHub | `denner2701-source/BalloonDesign`, `main` | Último commit remoto `ef25de83...`; não contém a reconstrução local |
| Vercel | projeto `balloon-design`, `prj_NpxdIn6NtP7YX0qrlRVuD9NppchX` | último deploy `dpl_eWeKiJisgVVU51a8fEpYE23FKSPp`, estático, READY |
| Supabase | projeto `balloon-design`, ref `ryffqldqedovhfedugyf`, `sa-east-1` | `ACTIVE_HEALTHY`, Postgres 17.6.1, 6 tabelas com RLS, zero dados de negócio |
| Candidato local | workspace `BalloonDesign` | 6 áreas principais, 7 estruturas, zero erros de console na regressão |

## Inventário funcional observado na referência

- Galeria: Geral/Destaque/Seguindo, busca por título/tag, filtro por tipo, paginação, abrir projeto, tags, perfil, compartilhar, denunciar, duplicar e curtir.
- Meus Projetos: busca, filtros de data/tipo e criação com sete estruturas.
- Calculadora de hélio: preço por m³, multiplicador, moeda, custo unitário, extras, custo de hélio, total e venda sugerida.
- Duplet redondo: cálculo por diâmetro ou quantidade, tamanho externo, dimensões e tamanho interno sugerido.
- Orgânico: metros, 1 a 10 cores e amarração com balão 260.
- Precificação: proposta, rateio mensal, materiais, equipe, impostos, taxas, reserva, margem e exportação.
- Configurações: conta, perfil público, foto, assinatura, gerenciamento de pagamento e exclusão condicionada.
- Editor da referência: **NÃO VERIFICADO NA REFERÊNCIA — NÃO É POSSÍVEL COMPROVAR PARIDADE FUNCIONAL** sem criar ou duplicar um projeto, o que modificaria o sistema de referência.

## Inventário funcional do candidato

- Estúdio 2D com pincel, preenchimento, borracha, mover, conversão de imagem, espelhamento, zoom, desfazer/refazer e prévia em perspectiva/Three.js.
- Sete estruturas: Painel Duplet, Painel Alternado, Duplet Alternado, Coluna, Arco, Disco e Orgânico.
- Grades predefinidas e personalizadas de 1×1 a 100×100.
- Paleta, quatro tamanhos, materiais por cor/tamanho, custo e checklist.
- Biblioteca local: buscar, filtrar, ordenar, abrir, duplicar, exportar e excluir.
- Galeria: modelos iniciais, busca/filtro, Geral/Meus/Seguindo, publicar, curtir, seguir, denunciar, compartilhar e remover, com autenticação exigida.
- Calculadoras de hélio, duplet, orgânico e rateio.
- Orçamento completo com materiais do design, adicionais, equipe, custos fixos, impostos, taxas, reserva, margem e CSV.
- Guia de montagem com PNG, CSV, impressão/PDF e checklist.
- Conta Supabase, recuperação de senha, perfil público e sincronização de projetos.

## Matriz de paridade funcional espelhada

| ID | Função | Entrada comum | Ações na referência | Resultado na referência | Ações no app auditado | Resultado no app auditado | Divergência | Evidência |
|---|---|---|---|---|---|---|---|---|
| MF-01 | Abrir galeria | Sessão disponível | Abrir Galeria | 43 projetos, filtros e paginação | Abrir Galeria local | 3 modelos iniciais; filtros funcionais | Regra diferente por base vazia; equivalente no objetivo | E-REF-01, E-RC-08 |
| MF-02 | Buscar projeto | Texto de título/tag | Digitar na busca | Lista filtrada | Digitar `QA Espelhado 20260817` | 1 resultado correto | Equivalente | E-RC-04 |
| MF-03 | Filtrar por tipo | Tipo de estrutura | Selecionar tipo | Cards compatíveis | Selecionar tipo | Cards compatíveis | Equivalente | E-REF-01, inspeção RC |
| MF-04 | Criar projeto | Nome e Painel Duplet | Abrir modal e cancelar | 7 tipos exibidos; sem persistência | Criar `QA Espelhado 20260817`, 12×8 | Projeto criado e editável | Superior no teste executado; referência não modificada | E-REF-02, E-RC-01 |
| MF-05 | Pintar uma célula | Cor Manteiga, 9 pol. | Não executado para não alterar a referência | Não verificado | Pincel no centro | 1 unidade contabilizada | Não comparável por falta de evidência | E-RC-01 |
| MF-06 | Preencher área | Lavanda | Editor da referência não executado | Não verificado | Ferramenta Preencher em célula vazia | 95 Lavanda + 1 Manteiga antes da borracha | Não comparável por falta de evidência | E-RC-01 |
| MF-07 | Desfazer/refazer | Uma pintura | Editor da referência não executado | Não verificado | Pintar, desfazer e refazer | 1→0→1, estado coerente | Não comparável por falta de evidência | E-RC-01 |
| MF-08 | Salvar e recuperar | Projeto com 95 balões | Não executado | Não verificado | Salvar, recarregar e abrir | Nome, grade e 95 células preservados | Superior no teste executado | E-RC-02 |
| MF-09 | Duplicar | Projeto existente | Botão disponível; não acionado | Não verificado sem escrita | Duplicar projeto local | Cópia independente com 95 células | Não comparável por falta de evidência | E-RC-04 |
| MF-10 | Exportar projeto | Projeto com acento no nome | Não observado | Não verificado | Exportar JSON | JSON válido; 96 células, 95 ocupadas | Função adicional no candidato | E-RC-05 |
| MF-11 | Hélio 9 pol. | R$300/m³, perda 10%, custo R$0,88, multiplicador 2 | Campos e saídas observados, sem gravação | Fórmula não comprovada | Informar valores | Hélio R$1,86; total R$2,74; venda R$5,48 | Não comparável na fórmula; candidato reconciliado | E-RC-10 |
| MF-12 | Duplet por diâmetro | 100 cm, balão 3,25 pol. | Modo e campos observados | Fórmula não comprovada | Informar valores | 24 duplets, 48 externos, interno 2,02 pol. | Não comparável na fórmula; candidato reconciliado | E-RC-11 |
| MF-13 | Duplet por quantidade | 20 duplets, 3,25 pol. | Modo observado | Fórmula não comprovada | Informar valores | 86,7 cm, 40 externos | Não comparável na fórmula; candidato reconciliado | E-RC-11 |
| MF-14 | Arco orgânico | 8 m, 4 cores, com 260 | Campos e limites observados | Fórmula não comprovada | Informar valores | 520 balões, 16 balões 260; distribuição soma 520 | Não comparável na fórmula; candidato reconciliado | E-RC-12 |
| MF-15 | Ratear custos | 10 serviços; aluguel 1200; energia 300; equipamentos 6000; veículo 18000 | Campos observados | Fórmula não comprovada | Informar valores | R$1.700/mês; R$170/serviço | Não comparável na fórmula; candidato reconciliado | E-RC-13 |
| MF-16 | Orçamento | 95×R$0,88; reserva 10%; MO 120; insumos 25; rateio 170; extras 20; equipe 60; taxas 10%; margem 35% | Estrutura equivalente observada | Não gravado na referência | Informar e salvar | custo R$486,96; venda R$885,38; taxas R$88,54; lucro R$309,88 | Candidato funcionalmente reconciliado | E-RC-14, E-RC-15 |
| MF-17 | Exportar lista | 95 Lavanda 9 pol. | Exportação disponível | Arquivo não gerado | Exportar CSV e PNG | CSV coerente; PNG válido e visualmente compatível | Candidato comprovado | E-RC-06, E-RC-07 |
| MF-18 | Áreas privadas | Sem sessão | Referência autenticada | Conteúdo disponível | Abrir Meus/Seguindo/Publicar sem sessão | Solicita login; não vaza conteúdo | Regra correta para estado anônimo | E-RC-08 |
| MF-19 | Login inválido | E-mail fictício e senha inválida | Não executado | Não verificado | Enviar uma tentativa | Erro genérico, sem console error | Candidato correto | E-RC-09 |
| MF-20 | Configurações públicas | Nome e usuário | Modal observado; não salvo | Campos e assinatura presentes | Abrir conta no candidato | Perfil público e recuperação presentes; assinatura ausente | Regra diferente; pagamentos fora do candidato atual | E-REF-04, inspeção RC |
| MF-21 | Responsividade | 360 a 1920 px | Desktop/celular observado parcialmente | Navegação disponível | Executar 7 viewports | Sem overflow; menu móvel abre/navega/fecha | Candidato comprovado | E-RC-17 |
| MF-22 | Sete estruturas | Sete tipos | Modal lista os sete | Criação não executada | Alternar os sete no editor | Renderizados sem erros de console | Candidato comprovado; referência parcialmente observada | E-REF-02, E-RC-16 |

## Cálculos independentes

1. Hélio: volume esférico aproximado com fator útil 0,9; preço × volume × perda; soma de balão/extras; multiplicador aplicado ao total.
2. Duplet: `ceil(π × diâmetro / (tamanho_cm × 1,65))`; tamanho interno 62% do externo.
3. Orgânico: 65 balões/m; mistura 55/30/12/3%; o último tamanho recebe o resíduo para reconciliação exata.
4. Rateio: despesas mensais + equipamento/60 meses + veículo/180 meses; divisão por serviços/mês.
5. Orçamento: custo direto + reserva + fixos + variáveis; venda `custo / (1 - margem - taxas)`; venda = custo + taxas + lucro.

Os sete casos automatizados em `tests/calculation-core.test.cjs` passaram, inclusive reconciliação de R$885,38 = R$486,96 + R$88,54 + R$309,88 (com arredondamento por linha).

## Segurança e Supabase

- Nenhuma chave `service_role`, chave Stripe secreta, chave privada ou credencial de alto risco foi encontrada no código do aplicativo. A chave Supabase presente é publicável e protegida por RLS.
- Seis tabelas públicas têm RLS ativo; dados de negócio e usuários Auth estavam em zero no momento da auditoria.
- Políticas privadas usam `auth.uid()` para dono; perfis e projetos publicados têm leitura pública intencional.
- A migração `20260817170212_tighten_public_table_grants` removeu `TRUNCATE`, `TRIGGER` e `REFERENCES` desnecessários e manteve somente os verbos usados.
- Advisor de segurança: zero alertas após a migração.
- Advisor de desempenho: somente avisos informativos de índices ainda não utilizados, esperado com tabelas vazias; não foram removidos prematuramente.
- Entrada de projetos/paletas foi normalizada para formato, dimensões e cores seguras; nomes continuam escapados antes de `innerHTML`.
- Teste de isolamento com duas contas: **NÃO VERIFICADO** porque não havia usuários de teste nem caixa de e-mail controlada.

## Acessibilidade

- `lang=pt-BR`, título, `main`, `nav`, `aside`, cabeçalhos, botões nomeados e diálogos com título/fechar presentes.
- Foco inicial de modal observado no botão Fechar.
- Canvas recebeu foco, nome dinâmico, atalhos, navegação por setas, pintura por Enter/Espaço e exclusão por Delete/Backspace.
- Controles de imagem, reserva e margem receberam nomes acessíveis.
- Operação por teclado e concordância `1 balão` foram retestadas sem erro de console.
- Leitor de tela real, contraste automatizado e fechamento por Escape em navegador físico permanecem pendentes.

## Responsividade

| Viewport | Conteúdo útil | Overflow horizontal | Navegação |
|---|---:|---:|---|
| 360×800 | 345 px | não | menu móvel funcional |
| 390×844 | 375 px | não | menu móvel funcional |
| 768×1024 | 753 px | não | navegação desktop |
| 1024×768 | 1009 px | não | navegação desktop |
| 1366×768 | 1351 px | não | navegação desktop |
| 1440×900 | 1425 px | não | navegação desktop |
| 1920×1080 | 1920 px | não | navegação desktop |

## Desempenho

Servidor local, três leituras HTTP do HTML: 183,69 ms (primeira), 6,59 ms e 5,44 ms; mediana 6,59 ms. O arquivo principal tem 26.218 bytes; o maior artefato é `vendor.js` com 945.624 bytes antes de compressão HTTP.

Não há medição Lighthouse/Web Vitals confiável neste ambiente. LCP, CLS, INP, consumo de memória e métricas da produção corrigida devem ser coletados depois do deploy. O bundle vendor é candidato a divisão/carregamento tardio.

## Correções implementadas nesta rodada

- Núcleo único e testável para hélio, duplet, orgânico, rateio e orçamento.
- Sete testes automatizados com `node:test` e script `npm test`/`npm run check`.
- Nomes de arquivo com remoção correta de acentos (`copia`, não `c-pia`).
- CSV de orçamento com valores arredondados, sem caudas de ponto flutuante.
- Concordância `1 balão`/`n balões` em editor, guia, orçamento e biblioteca.
- Operação do canvas por teclado e nomes acessíveis ausentes.
- Normalização/limite de formas, grades, paleta, IDs e textos importados.
- Migração de privilégio mínimo no Supabase.

## Pendências bloqueadoras

1. Autenticar o GitHub CLI e publicar a reconstrução local em branch/PR controlado.
2. Aguardar o deploy Vercel e repetir toda a regressão no domínio público.
3. Criar duas contas QA com caixas de e-mail controladas para Auth, reset e isolamento RLS.
4. Verificar impressão/PDF em ambiente físico e leitor de tela.
5. Decidir comercialmente se assinatura/pagamento fazem parte do Balloon Design; não foi copiado Stripe da referência.

## Critério de liberação

Somente alterar para **APROVADO PARA PRODUÇÃO** depois de: deploy do candidato exato, zero P0/P1, rotas sem 404 ou controles fantasmas, Auth/RLS entre dois usuários aprovado, exportações e impressão aprovadas e nova varredura de segurança sem alertas críticos.
