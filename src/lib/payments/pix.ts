// Gera BR Code Pix estático (payload EMV copia-e-cola).
// Não depende de API externa: usável em apps bancários com chave Pix cadastrada.

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function sanitizeText(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, max);
}

function normalizeMerchantName(name: string) {
  const clean = sanitizeText(name, 25);
  if (!clean) return "TG15 ONLINE";
  if (clean.length < 5) return `${clean} ONLINE`.slice(0, 25);
  return clean;
}

function normalizeTxid(txid?: string) {
  if (!txid) return "***";
  if (txid === "***") return "***";
  const clean = txid
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 25);
  return clean || "***";
}

function normalizePixKey(key: string, keyType?: PixParams["keyType"]) {
  const raw = key.trim();
  if (!raw) throw new Error("Informe uma chave Pix para gerar o QR Code.");

  if (keyType === "cpf") {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 11) throw new Error("A chave Pix CPF deve ter 11 dígitos.");
    return digits;
  }

  if (keyType === "cnpj") {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 14) throw new Error("A chave Pix CNPJ deve ter 14 dígitos.");
    return digits;
  }

  if (keyType === "telefone") {
    const hasPlus = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "");
    const phone = hasPlus ? `+${digits}` : digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
    if (!/^\+55\d{10,11}$/.test(phone)) {
      throw new Error("A chave Pix telefone deve estar no formato brasileiro com DDD.");
    }
    return phone;
  }

  if (keyType === "email") {
    const email = raw.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail Pix válido.");
    return email;
  }

  if (keyType === "aleatoria") {
    const evp = raw.toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(evp)) {
      throw new Error("A chave aleatória Pix deve estar no formato UUID informado pelo banco.");
    }
    return evp;
  }

  return raw;
}

function formatAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("O valor do Pix deve ser maior que zero.");
  return (Math.round(amount * 100) / 100).toFixed(2);
}

// CRC16-CCITT (0x1021), init 0xFFFF — padrão Pix
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type PixParams = {
  key: string;              // chave Pix (CPF/CNPJ/email/telefone/aleatória)
  keyType?: "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
  amount: number;           // valor em reais (ex.: 145.90)
  merchantName: string;     // nome do recebedor (max 25)
  merchantCity: string;     // cidade (max 15)
  txid?: string;            // identificador (max 25, alfanumérico)
};

export function buildPixPayload({ key, keyType, amount, merchantName, merchantCity, txid = "***" }: PixParams) {
  const gui = tlv("00", "br.gov.bcb.pix");
  const keyField = tlv("01", normalizePixKey(key, keyType));
  const merchantAccountInfo = tlv("26", gui + keyField);

  const name = normalizeMerchantName(merchantName);
  const city = sanitizeText(merchantCity, 15) || "SAO PAULO";
  const txidClean = normalizeTxid(txid);
  const amountStr = formatAmount(amount);

  const payload =
    tlv("00", "01") +                                                // Payload Format Indicator
    // O campo 01 (Point of Initiation) é opcional. Mantê-lo fora deixa o
    // copia-e-cola estático mais compatível com apps bancários brasileiros.
    merchantAccountInfo +                                            // 26 — Merchant Account Info
    tlv("52", "0000") +                                              // MCC
    tlv("53", "986") +                                               // Moeda BRL
    tlv("54", amountStr) +                                           // Valor
    tlv("58", "BR") +                                                // País
    tlv("59", name) +                                                // Nome
    tlv("60", city) +                                                // Cidade
    tlv("62", tlv("05", txidClean)) +                                // Additional data — txid
    "6304";                                                          // CRC placeholder

  return payload + crc16(payload);
}

export function pixQrImageUrl(payload: string, size = 260) {
  // Renderização via serviço público de QR — o payload em si é copia-e-cola válido.
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(payload)}`;
}
