/** Gera um CPF válido (dígitos verificadores corretos), fictício, a partir de uma semente numérica. */
export function cpfValido(semente: number): string {
  const base = String(100000000 + (semente % 800000000)).padStart(9, '0').slice(0, 9).split('').map(Number);
  const dv = (nums: number[]) => {
    const soma = nums.reduce((acc, n, i) => acc + n * (nums.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base);
  const d2 = dv([...base, d1]);
  return [...base, d1, d2].join('');
}

export const mascararCpf = (c: string) => `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
