# Comparação funcional com a plataforma de referência

Auditoria visual e funcional realizada em 17/08/2026 nas áreas públicas e autenticadas acessíveis de `decorabalao.com.br`. A referência serviu para mapear fluxos; textos, identidade visual, código e projetos artísticos não foram copiados.

## Matriz de cobertura

| Área observada | BalloonDesign reconstruído | Situação |
| --- | --- | --- |
| Galeria geral com busca, tipo e cartões | Busca por título/tag/autor, filtro por tipo e modelos originais | Funcional |
| Galeria “Meus projetos” | Filtra as publicações do usuário conectado | Funcional |
| Galeria “Seguindo” | Seguir/deixar de seguir perfis e feed correspondente | Funcional |
| Duplicar projeto público | Cria uma cópia privada e abre o editor | Funcional |
| Curtir, compartilhar e denunciar | Persistência no Supabase, compartilhamento nativo/clipboard e denúncia protegida | Funcional |
| Perfil público | Nome público e usuário exclusivo | Funcional |
| Biblioteca de projetos | Busca, filtro por tipo, ordenação, abrir, duplicar, exportar e excluir | Funcional |
| Tipos de estrutura | Painel Duplet, Painel Alternado, Duplet Alternado, Coluna, Arco, Disco e Orgânico | Funcional |
| Editor visual | Pintura, arrasto, preenchimento, borracha, paleta, tamanho, zoom, pan, espelho e histórico | Funcional |
| Conversão de imagem | Quantização para a paleta escolhida | Funcional |
| Prévia 3D | Geometria distinta para os sete tipos | Funcional |
| Calculadora de hélio | Preço/m³, perda, custo de balão, extras e venda mínima | Funcional |
| Calculadora duplet redondo | Cálculo por diâmetro ou quantidade | Funcional |
| Calculadora orgânica | Metros, cores, mistura de tamanhos e balões 260 | Funcional |
| Rateio de custo fixo | Despesas, serviços/mês e depreciação de equipamentos/veículo | Funcional |
| Precificação | Custos, equipe, materiais extras, imposto, cartão, risco e lucro | Funcional |
| Relatórios técnicos | Lista CSV, imagem PNG, guia de montagem e impressão/PDF | Funcional |
| Conta e segurança | Cadastro, login, recuperação, logout, modo local e sincronização | Funcional |
| Tema escuro | Preferência persistente | Funcional |

## Deliberadamente fora da interface até existir infraestrutura real

Estes recursos foram identificados, mas não receberam páginas ou botões de fachada:

- assinatura, teste gratuito, cobrança e portal Stripe: exigem conta Stripe, produtos, preços, webhook e regras de acesso escolhidos pelo proprietário;
- upload de avatar: exige política de armazenamento, limites, tratamento de imagem e moderação;
- administração de denúncias: exige papéis administrativos e uma política operacional de moderação;
- interface multilíngue completa: exige revisão de toda a terminologia técnica e comercial;
- e-mails transacionais personalizados: exigem domínio de envio e provedor configurados;
- versão histórica e colaboração em tempo real: exigem modelo de conflitos e retenção definido.

## Critério contra “botões fantasmas”

Todo controle visível na base atual possui ação implementada. Recursos que dependem de uma decisão comercial ou credencial secreta ficam documentados, mas ocultos da interface até poderem completar o fluxo de ponta a ponta.
