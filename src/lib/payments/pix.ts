// Gera BR Code Pix (payload EMV copia-e-cola).
// Não depende de API externa: usável em qualquer app bancário.

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function sanitize(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max);
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
  amount: number;           // valor em reais (ex.: 145.90)
  merchantName: string;     // nome do recebedor (max 25)
  merchantCity: string;     // cidade (max 15)
  txid?: string;            // identificador (max 25, alfanumérico)
};

export function buildPixPayload({ key, amount, merchantName, merchantCity, txid = "***" }: PixParams) {
  const gui = tlv("00", "br.gov.bcb.pix");
  const keyField = tlv("01", key.trim());
  const merchantAccountInfo = tlv("26", gui + keyField);

  const payload =
    tlv("00", "01") +                                                // Payload Format Indicator
    tlv("01", "12") +                                                // Point of Initiation (dinâmico p/ 1 uso; use 11 p/ reutilizável)
    merchantAccountInfo +                                            // 26 — Merchant Account Info
    tlv("52", "0000") +                                              // MCC
    tlv("53", "986") +                                               // Moeda BRL
    tlv("54", amount.toFixed(2)) +                                   // Valor
    tlv("58", "BR") +                                                // País
    tlv("59", sanitize(merchantName, 25) || "RECEBEDOR") +           // Nome
    tlv("60", sanitize(merchantCity, 15) || "SAO PAULO") +           // Cidade
    tlv("62", tlv("05", sanitize(txid, 25) || "***")) +              // Additional data — txid
    "6304";                                                          // CRC placeholder

  return payload + crc16(payload);
}

export function pixQrImageUrl(payload: string, size = 260) {
  // Renderização via serviço público de QR — o payload em si é copia-e-cola válido.
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(payload)}`;
}
