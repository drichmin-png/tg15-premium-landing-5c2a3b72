export function cleanCEP(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 8);
}

export function formatCEP(v: string): string {
  const s = cleanCEP(v);
  if (s.length <= 5) return s;
  return s.slice(0, 5) + "-" + s.slice(5);
}

export type ViaCepResult = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function lookupCEP(cep: string): Promise<ViaCepResult | null> {
  const s = cleanCEP(cep);
  if (s.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${s}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResult;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}
