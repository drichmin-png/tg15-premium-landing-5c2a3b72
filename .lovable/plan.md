## Sistema de Pagamentos Multi-Gateway — Plano de Implementação

Escopo grande. Proponho executar em **4 fases** para você validar cada parte antes de seguir. Nada quebra o que já existe (checkout local em `cart-store`, admin em `localStorage`, tabelas `orders`/`order_items`/`admin_settings` já criadas).

### Fase 1 — Backend: schema e webhook (essencial)

Migration única criando/ajustando:

- **`gateways`**: `id`, `nome`, `tipo` (enum `ironpay|pagarme|mercadopago|outro`), `chave_publica`, `chave_secreta`, `tipo_chave_pix`, `chave_pix`, `ativo`, `padrao`, `prioridade`, timestamps. RLS: só admin lê/escreve (via `has_role`).
- **`webhook_logs`**: `id`, `gateway_tipo`, `pedido_id` (nullable), `payload` (jsonb), `assinatura_valida` (bool), `sucesso` (bool), `erro`, `created_at`. RLS: só admin lê.
- **`orders` (ALTER)**: `gateway_utilizado`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `status_rastreio` (`preparando|a_caminho|entregue`), `rastreio_atualizado_em`, `chargeback_flag`.
- **`admin_settings` (ALTER)**: `facebook_pixel_id`, `facebook_capi_token`, `utmify_api_key` (todos server-only leitura). Cliente continua lendo só o `pixel_id` publicável.

Rota pública única: `POST /api/public/webhook/$gateway` em `src/routes/api/public/webhook.$gateway.ts`:

- Lê `gateway_tipo` do path, busca credenciais, valida assinatura via adapter, grava `webhook_logs`, chama adapter → payload normalizado → atualiza `orders`. Sempre responde `200`.
- Adapter IronPay em `src/lib/gateways/adapters/ironpay.ts` com mapeamento de status conforme especificado.
- Interface `GatewayAdapter` (`verifySignature`, `parseWebhook`, `createPixCharge`, `createCardCharge`) para plugar novos gateways.

Regra de horário comercial (usa `admin_settings.business_days/hours` já existentes): scheduler simples via `pg_cron` chamando `/api/public/cron/tick-orders` a cada 15 min, que promove `preparando → a_caminho` entre 4h–6h **dentro do expediente**.

Eventos de conversão em `src/lib/tracking/server-events.ts`:
- Facebook CAPI (`Purchase`) com hash SHA-256 de email/telefone.
- UTMify (POST com UTMs salvas no pedido).
Disparados quando webhook marca pedido como `pago`.

### Fase 2 — Checkout real com criação de cobrança

- Server fn `createCharge` seleciona gateway `padrao=true, ativo=true`, tenta criar cobrança via adapter (Pix ou cartão com parcelas). Em erro, tenta próximo por `prioridade`. Grava `gateway_utilizado` no pedido.
- Migrar checkout atual (hoje só localStorage) para inserir `orders` + `order_items` reais no banco no passo final, com UTMs vindas de `useUtmParams`.
- Tela de confirmação Pix: loading → QR Code retornado pelo gateway → botão copiar (fallback para QR gerado local com chave, já implementado).
- Cartão: mantém parcelamento 1x–12x já existente; envia dados ao gateway.

### Fase 3 — Painel Admin

Novas abas em `/admin`:
- **Gateways**: lista, adicionar/editar/excluir, marcar padrão, definir prioridade, botão "Copiar URL de postback" (`https://<domain>/api/public/webhook/<tipo>`), botão "Testar credenciais", toggle ativo/inativo.
- **Logs de Webhook**: lista filtrada por gateway com payload/erro, badge de sucesso.
- **Pedidos**: já existe; adicionar coluna `gateway_utilizado`, alerta visual para `chargeback_flag`, status de rastreio editável, campo NF-e (já existe `invoice_url`).
- **Integrações**: campos para Pixel ID, CAPI token, UTMify key, link do grupo WhatsApp, suporte.

Autenticação do painel: manter a senha atual (`ADMIN_PANEL_PASSWORD`) — todas as server fns novas validam essa senha antes de tocar em `gateways`/`webhook_logs`.

### Fase 4 — Polimento

- Alertas no admin para chargeback/pedido inexistente no webhook.
- Copiar-e-cola Pix com feedback visual.
- Documentação inline dos endpoints.

### Detalhes técnicos

- Adapters ficam em `src/lib/gateways/adapters/*.ts` implementando a mesma interface — para adicionar Pagar.me/MercadoPago basta criar novo arquivo e registrar no `getAdapter(tipo)`.
- Segredos dos gateways ficam **no banco**, criptografados na leitura pública (server-only via `supabaseAdmin` dentro do handler). Nunca vão pro cliente.
- Facebook CAPI Access Token e UTMify Key: como são **um por projeto**, ficam em `admin_settings` (server-only) — não precisa criar secret separado no ambiente.
- Webhook responde sempre 200 mesmo em erro, mas grava `sucesso=false` + `erro` em `webhook_logs`.
- `pg_cron` + `pg_net` chamando rota interna resolve a regra de horário comercial sem worker externo.

### Perguntas antes de começar

1. **Confirma que a Fase 1 (migration grande + webhook + adapter IronPay + CAPI/UTMify no servidor) é o próximo passo agora**, e faço Fase 2/3/4 depois em mensagens separadas?
2. **IronPay**: você tem a documentação da API deles (URL de criação de cobrança Pix/cartão, formato da assinatura do webhook)? Sem isso, o adapter fica com placeholders e o webhook não valida assinatura real — só o mapeamento de status funciona. Se você colar o link da doc ou os endpoints, eu já implemento o `verifySignature` + `createPixCharge` corretos.
3. **Migração dos dados atuais**: hoje o admin salva tudo em `localStorage`. Ok migrar as configurações (pixel, textos, whatsapp, pix) para `admin_settings` no banco nessa fase, ou prefere manter em localStorage por mais um tempo?
