import { formatBRL } from "@/lib/product";

export const MAX_INSTALLMENTS = 12;

export function installmentOptions(total: number) {
  const opts: { n: number; label: string; each: number }[] = [];
  for (let n = 1; n <= MAX_INSTALLMENTS; n++) {
    const each = Math.round((total / n) * 100) / 100;
    opts.push({
      n,
      each,
      label: `${n}x de ${formatBRL(each)}${n === 1 ? " à vista" : " sem juros"}`,
    });
  }
  return opts;
}
