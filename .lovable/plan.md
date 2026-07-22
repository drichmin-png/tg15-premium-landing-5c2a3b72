# Reorganização do painel admin

Hoje o acesso está espalhado entre `/admin` (só redireciona), `/master/login`, `/master/tenants` e `/master/orders`. A ideia é voltar ao modelo de ontem — **um único painel admin com abas** — e encaixar a criação de operadores como mais uma aba dentro dele.

## Como fica para o usuário

- Um único login em **`/admin`** (senha administrativa, como era ontem).
- Dentro do painel, as abas de ontem voltam **na mesma ordem**:
  - Pedidos
  - Relatório & IA
  - Produtos e Preços
  - Hero / Textos
  - Blocos da Página
  - Facebook Pixel & Tracking
  - Pagamento Pix
  - Gateway de Pagamento
  - Suporte / WhatsApp
  - Segurança
- **Nova aba "Operadores"** (posicionada logo antes de "Segurança") com o fluxo de hoje:
  - Lista de operadores com busca
  - Botão "+ Novo operador" (só pede Nome, Tipo de acesso, Senha)
  - Após criar: modal com Link de acesso + Usuário + Senha, botões "Copiar" e "Enviar por WhatsApp"
  - Ações por linha: Entrar (impersonar), Reset de senha, Bloquear/Liberar, Excluir, além do link individual `/app/{slug}` visível para cópia rápida
- **`/master/login`, `/master/tenants`, `/master/orders` e `/master/`** deixam de existir como páginas próprias — passam a redirecionar para `/admin` para não quebrar links salvos.
- Os painéis individuais de cada operador em **`/app/{slug}/…`** continuam iguais (não faz parte deste ajuste).

## O que muda no código

- `src/routes/admin.tsx`
  - Remove o redirecionamento; volta a montar `LoginScreen` + `Dashboard` como ontem.
  - Adiciona `"operadores"` na lista de abas e um novo painel `OperadoresPanel` que reaproveita a UI atual de `/master/tenants` (tabela + modal de criação com link/WhatsApp).
  - Move o botão "Painel Master" que estava no header — no lugar dele fica só "Sair" e "Salvar alterações", como era.
- `src/routes/master.login.tsx`, `master.tenants.tsx`, `master.orders.tsx`, `master.index.tsx`
  - Cada um vira um redirect leve para `/admin` (mantém a URL funcionando, sem duplicar tela).
- `src/lib/saas-local.ts` continua sendo a fonte de verdade dos operadores (nenhuma mudança de dados). A tabela de operadores dentro do admin lê/escreve exatamente pelas mesmas funções que a página `/master/tenants` usa hoje, então nada dos operadores já criados se perde.
- Login: o admin volta a usar `admin.loginRemote(senha)` (senha administrativa gravada no backend). O login "master" separado deixa de existir.

## Detalhes técnicos

- A aba Operadores é um componente novo dentro de `admin.tsx` para manter tudo num só lugar; ele usa `listLocalTenants`, `createLocalTenant`, `deleteLocalTenant`, `resetLocalTenantPassword`, `setLocalTenantStatus`, `impersonateLocalTenant`, `buildLocalTenantAccessUrl` — já expostos em `src/lib/saas-local.ts`.
- Ao impersonar (botão "Entrar" numa linha), o painel chama `impersonateLocalTenant(id)` e navega para `/app/$slug/dashboard`, exatamente como já funciona hoje.
- `master.*.tsx` viram arquivos de ~10 linhas com `component: () => <Navigate to="/admin" replace />` — o `routeTree.gen.ts` é regenerado automaticamente.
- Nenhuma migração de banco. Nenhuma mudança em rotas de operador (`/app/$slug/*`) nem no checkout / loja.

## Fora do escopo

- Não mexer no visual da loja, do checkout, nem dos painéis individuais dos operadores.
- Não mexer nos policies/RLS ajustados no turno anterior.
