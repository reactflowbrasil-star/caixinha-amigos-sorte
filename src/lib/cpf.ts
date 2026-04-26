// Validação de CPF (algoritmo dos dígitos verificadores). Sem chamada externa.

export function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

export function formatCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9, 11)].filter(Boolean);
  if (p.length <= 1) return p.join("");
  if (p.length === 2) return `${p[0]}.${p[1]}`;
  if (p.length === 3) return `${p[0]}.${p[1]}.${p[2]}`;
  return `${p[0]}.${p[1]}.${p[2]}-${p[3]}`;
}

export function isValidCPF(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += parseInt(cpf[i], 10) * (slice + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(cpf[9], 10) && calc(10) === parseInt(cpf[10], 10);
}
