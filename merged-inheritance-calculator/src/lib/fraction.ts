export type Frac = { n: number; d: number };

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
};

export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);

export const F = (n: number, d = 1): Frac => {
  if (d === 0) return { n: 0, d: 1 };
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};

export const ZERO: Frac = { n: 0, d: 1 };
export const ONE: Frac = { n: 1, d: 1 };

export const add = (a: Frac, b: Frac) => F(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac) => F(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac) => F(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac) => (b.n === 0 ? ZERO : F(a.n * b.d, a.d * b.n));
export const num = (a: Frac) => a.n / a.d;
export const isZero = (a: Frac) => a.n === 0;
export const gt = (a: Frac, b: Frac) => a.n * b.d > b.n * a.d;

export const fmt = (a: Frac) => {
  if (a.n === 0) return "0";
  if (a.d === 1) return `${a.n}`;
  return `${a.n}/${a.d}`;
};
