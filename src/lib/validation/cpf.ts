export function cleanCPF(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 11);
}

export function formatCPF(v: string): string {
  const s = cleanCPF(v);
  const p1 = s.slice(0, 3);
  const p2 = s.slice(3, 6);
  const p3 = s.slice(6, 9);
  const p4 = s.slice(9, 11);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "-" + p4;
  return out;
}

/** Full CPF validation: length, not-all-same digits, and both check digits. */
export function isValidCPF(v: string): boolean {
  const s = cleanCPF(v);
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false; // 111.111.111-11 etc.

  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (const ch of base) {
      sum += parseInt(ch, 10) * factor--;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calc(s.slice(0, 9), 10);
  if (d1 !== parseInt(s[9], 10)) return false;
  const d2 = calc(s.slice(0, 10), 11);
  if (d2 !== parseInt(s[10], 10)) return false;
  return true;
}
