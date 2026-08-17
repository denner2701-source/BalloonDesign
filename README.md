# BalloonDesign

Aplicação web para planejar decorações com balões. Esta base é independente do projeto anterior e usa um projeto Supabase novo. O frontend contém apenas a chave pública própria para navegador; nenhuma credencial administrativa ou chave secreta faz parte do código.

## Funcionalidades atuais

- editor visual para Painel Duplet, Painel Alternado, Duplet Alternado, Coluna, Arco, Disco e Orgânico;
- pintura manual, preenchimento, borracha e desenho por arrasto;
- paleta personalizável e conversão de imagem para a paleta selecionada;
- grades de até 100 × 100, pan, espelhamento, desfazer/refazer e zoom;
- balões de 5, 9, 11 e 16 polegadas por célula;
- prévia 3D sincronizada e específica para os sete tipos de estrutura;
- cálculo de materiais por cor e tamanho, lista CSV e guia em PNG/PDF;
- calculadoras de hélio, duplet redondo, arco orgânico e rateio de custos fixos;
- orçamento profissional com materiais adicionais, equipe, impostos, cartão, reserva e margem;
- checklist técnico de montagem;
- galeria pesquisável com publicação, duplicação, compartilhamento, curtidas, denúncias e remoção pelo autor;
- perfil público e feed de decoradores seguidos;
- projetos salvos localmente e sincronizados por usuário autenticado;
- cadastro, login, recuperação de senha e logout por e-mail usando Supabase Auth;
- tema claro/escuro e interface responsiva para desktop e celular.

## Segurança e dados

- tabela `public.projects` protegida por RLS;
- tabelas sociais `profiles`, `published_projects`, `gallery_likes`, `gallery_reports` e `profile_follows` com RLS;
- cada usuário só pode consultar e alterar os próprios projetos;
- modo local continua disponível sem conta ou quando a nuvem estiver indisponível;
- nenhuma chave `service_role` é usada no navegador.

## Executar localmente

Sirva a pasta em um servidor HTTP local e abra `index.html`. O arquivo `vendor.js` já está gerado, portanto não é necessário instalar dependências para apenas executar a aplicação.

Para reconstruir as bibliotecas locais:

```bash
pnpm install
pnpm run build:vendor
```

## Itens que dependem de decisão/conta externa

Assinaturas e portal de cobrança Stripe, upload de avatar, login Google, e-mails personalizados e painel de moderação não aparecem como botões falsos. Eles só devem entrar na interface depois que as respectivas contas, regras e fluxos de produção forem definidos.

Para publicar: criar um repositório GitHub novo, conectar um projeto Vercel novo e cadastrar a URL de produção nas URLs permitidas do Supabase Auth.

Consulte a [auditoria dos projetos Stitch](STITCH_AUDIT.md) e a [comparação funcional com a referência](DECORA_COMPARISON.md).
