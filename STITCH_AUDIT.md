# Auditoria dos projetos Stitch

Fontes analisadas:

- Balloon Decoration Design Platform — projeto Stitch `13297717217408991066`
- Stitch Vercel Supabase Integration — projeto Stitch `11071577432804772820`
- pacotes ZIP fornecidos na conversa

## Visão consolidada do produto

O BalloonDesign deve oferecer um fluxo único:

1. autenticação e conta do decorador;
2. dashboard e biblioteca de projetos;
3. criação de sete estruturas: Painel Duplet, Painel Alternado, Duplet Alternado, Coluna, Arco, Disco ou Orgânico;
4. pintura manual ou automática a partir de imagem;
5. visualização 3D interativa;
6. contagem de balões por cor e tamanho;
7. orçamento, lista de compras e checklist operacional;
8. guia de montagem em PNG/PDF;
9. persistência segura na nuvem;
10. galeria pública e perfis seguidos;
11. administração, assinatura e controle de acesso.

## O que já está implementado na base limpa

- editor e prévia 3D dos sete tipos de estrutura;
- pincel, preenchimento, borracha e desenho por arrasto;
- paleta personalizada;
- pintura automática baseada em imagem;
- grades até 100 × 100, pan, espelhamento, desfazer/refazer e zoom;
- tamanhos de 5, 9, 11 e 16 polegadas por célula;
- prévia Three.js sincronizada com o desenho;
- projetos persistidos localmente e sincronizados no Supabase por usuário;
- cadastro, login, recuperação de senha e logout com e-mail e senha;
- tabelas privadas e sociais com RLS e políticas de propriedade;
- cálculo de materiais por cor e tamanho;
- calculadoras de hélio, duplet, orgânico e custos fixos;
- orçamento com cliente, evento, materiais adicionais, equipe, impostos, cartão, reserva técnica e margem;
- checklist técnico persistente;
- lista de compras CSV;
- guia em PNG e impressão/PDF;
- layout responsivo refinado.
- galeria com publicação, busca, filtros, duplicação, compartilhamento, curtidas, denúncias e remoção;
- perfil público e feed de usuários seguidos;
- modo claro/escuro.

## Lacunas prioritárias

### P0 — núcleo de produção restante

- histórico/versionamento de alterações do projeto;
- estados de carregamento, falha, conflito e modo offline;
- proteção administrativa baseada em autorização confiável.

### P1 — refinamento do editor

- seleção múltipla e copiar/colar;
- 3D otimizado com `InstancedMesh` para centenas ou milhares de balões;
- exportação de guia com coordenadas, numeração e legenda.

### P1 — operação do decorador

- cadastro de marcas, tamanhos, pacotes e preços;
- catálogo próprio de estruturas, nylon, inflador e outros insumos;
- propostas salvas e histórico de versões;
- PDF específico para o cliente e relatório técnico separado.

### P2 — negócio

- landing page original;
- planos, período de teste e Stripe;
- painel administrativo;
- métricas reais de uso e projetos;
- gestão de assinatura e cancelamento;
- termos, privacidade, suporte e onboarding.

## Código reaproveitável e código descartado

Reaproveitado:

- conceitos de cena, iluminação, esfera, nó do balão e controle de cor do protótipo Three.js;
- sistema visual arredondado, tipografia e hierarquia das telas;
- estrutura conceitual do orçamento e checklist;
- fluxo de pintura automática e exportação técnica.

Descartado:

- botões que apenas exibiam `alert()`;
- telas sem eventos ou persistência;
- placeholders de exportação;
- referências ao banco, domínio e credenciais do projeto antigo;
- manifesto de implantação contendo segredos;
- afirmações de que recursos estavam funcionais sem implementação correspondente.

## Segurança

Um dos projetos Stitch contém credenciais antigas em texto visível. Elas devem ser consideradas comprometidas e revogadas. Nenhuma delas foi copiada para a base nova.

A nova integração Supabase usa somente uma chave publicável no frontend. Operações administrativas permanecem fora do navegador, e as linhas da tabela `projects` são isoladas por usuário com RLS.

A chave de API do Stitch serve para autenticar um cliente MCP em `https://stitch.googleapis.com/mcp`. Ela permite listar projetos e telas, ler detalhes e, dependendo da ferramenta chamada, criar ou alterar projetos Stitch. Ela não substitui o ID numérico presente nos links compartilhados e nunca deve ser colocada no frontend ou em um repositório público.
