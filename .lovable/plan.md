
# Plano de implementação — 10 itens

## Observação importante sobre a Vercel
O stack do projeto (TanStack Start + nitro) é otimizado para **Cloudflare Workers**, que é onde o Lovable publica automaticamente em `tg15-premium-landing.lovable.app`. Deploy manual na Vercel exige adaptação do runtime e **quebra as server functions** (checkout, admin, pedidos, Pix). **Recomendação:** publicar apenas pelo botão Publish do Lovable — o site já fica com URL pública, SSL, custom domain se quiser, e o backend funciona nativamente. Vou implementar assumindo publicação via Lovable; se você insistir na Vercel, faremos ajustes adicionais depois.

## Fase 1 — Fundação (este turno)
**Backend / schema**
- Tabelas: `admin_settings` (singleton para prazo, WhatsApp, telefone suporte, link do grupo, horário comercial), `orders` (pedido + endereço + status pgto + status entrega + timestamps), `order_items`, `user_roles` (admin), `has_role()` security definer.
- RLS: admin lê tudo; cliente lê o próprio pedido por token público.
- Bucket público `product-media` para futuros uploads de mídia via admin.

**Item 4 — Prazo "2 a 5 dias úteis"**
- Trocar em FAQ, DosageTable/hero e checkout.

**Item 2 — Validação de CPF**
- Utilitário `validateCPF()` com dígito verificador + bloqueio de sequências (111.111.111-11 etc.). Aplicado no formulário do checkout com máscara e erro inline.

**Item 3 — Auto-preenchimento por CEP**
- Chamada ao ViaCEP (`https://viacep.com.br/ws/{cep}/json/`) ao completar 8 dígitos. Preenche automaticamente cidade, estado, bairro e rua; usuário só preenche número e ponto de referência.

**Item 5 — Parcelamento em 12x sem juros**
- Ao selecionar cartão, mostrar select de parcelas 1x–12x com o valor calculado sem juros.

## Fase 2 — Checkout completo + rastreio (próximo turno)
**Item 6 — Fluxo Pix**
- Como você escolheu "outro provedor", vou implementar o layout completo (loading → QR Code → botão copiar) com **QR Code gerado localmente** a partir de uma string Pix EMV (payload copia-e-cola) usando o CPF/chave que você configurar no admin. Fica 100% funcional para pagamento real via qualquer app de banco, sem depender de API externa. Se depois quiser conciliação automática, integramos um PSP.

**Item 7 e 8 — Botão WhatsApp e Suporte**
- Aparecem na tela de confirmação e num FAB (botão flutuante) fixo. Editáveis no admin (`admin_settings`).

**Item 9 — Painel de rastreio pós-pagamento**
- Rota `/pedido/$token` acessível ao cliente. Status calculado a partir de `paid_at` + regras de horário comercial (configurável no admin: início/fim/dias da semana). "Preparando pedido" nas primeiras 4h comerciais; "Pedido a caminho / Entregue" após 4h e até 6h comerciais.

## Fase 3 — Painel admin e detalhes finais
**Item 10 — Gestão de pedidos**
- Autenticação real (email/senha) no `/admin` substituindo a senha `admin123` do localStorage.
- Aba Pedidos: lista individualizada, filtro por status, view detalhada com dados do cliente, endereço, itens, status de pagamento editável, botão "gerar nota fiscal" (PDF simples via server function) e status de entrega editável (com override manual das regras de horário).
- Campos editáveis: link do grupo WhatsApp, telefone de suporte, prazo de entrega, horário comercial, chave Pix.

**Item 1 — Imagens em produção**
- Diagnóstico: as imagens hoje usam **assets do CDN Lovable** (`/__l5e/assets-v1/...`) e um único PNG local (`caixa-4-ampolas.png`). No ambiente Lovable publicado tudo funciona. Se você está tentando Vercel, o problema é que a Vercel não serve o CDN `/__l5e/...`. Corrigir migrando 100% dos assets para o CDN (o `caixa-4-ampolas.png` também) — funciona em qualquer host. Se você optar por continuar só no Lovable, esse item é 0 trabalho.

## Aviso de custo
Isso é grande. Vou executar Fase 1 já neste turno e parar para você testar. Se aprovar, respondo "seguir" e faço Fase 2, depois Fase 3. Se quiser mudar prioridades, me diz agora.
