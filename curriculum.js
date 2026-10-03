'use strict';

/* =========================================================
 *  학년별 학습 내용
 *  - formulas : 플래시카드
 *  - blanks   : 빈칸 채우기 문제 생성기
 *      { name, lhs, coeffs, cand }  → lhs = 전개식, coeffs 중 cand 위치 하나가 빈칸
 *      { name, answer, tex(blank) } → 직접 표기하는 문제
 *  - factors  : 인수분해 문제 생성기 gen(level) → { coeffs, template, answer, expand }
 *      template의 # 자리가 입력칸, expand(입력값) → 전개한 계수 (원래 식과 같으면 정답)
 * ========================================================= */

const BOX = '\\boxed{\\;?\\;}';
const P = (n) => (n < 0 ? `(${n})` : String(n)); // 음수는 괄호로 감싸기
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// 다항식 곱셈 (계수: 최고차항부터)
function polyMul(...ps) {
  return ps.reduce((acc, p) => {
    const out = new Array(acc.length + p.length - 1).fill(0);
    acc.forEach((a, i) => p.forEach((b, j) => { out[i + j] += a * b; }));
    return out;
  });
}

// 곱셈공식의 변형 값 구하기: variants 중 하나를 골라 문제 생성
function makeTransform(variants) {
  const v = pick(variants)();
  return {
    name: '곱셈공식의 변형 (식의 값 구하기)',
    answer: v.ans,
    tex: (blank) => `${v.cond}\\text{ 일 때,}\\quad ${v.target} = ${blank ? BOX : `${v.formula} = ${v.calc} = ${v.ans}`}`,
  };
}
// a, b: 서로 다른 0이 아닌 정수
function twoInts() {
  let a, b;
  do { a = randNonZero(-6, 6); b = randNonZero(-6, 6); } while (a === b);
  return [a, b];
}

/* =================== 중학교 3학년 =================== */
const M3 = {
  key: 'm3',
  short: '중3',
  title: '중학교 3학년',
  unit: '다항식의 곱셈과 인수분해',
  sample: '(a+b)(a-b) = a^2 - b^2',
  topics: ['곱셈공식 ①~④', '곱셈공식의 변형', '수의 계산', '인수분해 공식 ①~④'],
  formulas: [
    { cat: '곱셈공식', name: '곱셈공식 ① 완전제곱식 (합)', front: '(a+b)^2', back: 'a^2 + 2ab + b^2' },
    { cat: '곱셈공식', name: '곱셈공식 ① 완전제곱식 (차)', front: '(a-b)^2', back: 'a^2 - 2ab + b^2' },
    { cat: '곱셈공식', name: '곱셈공식 ② 합차 공식', front: '(a+b)(a-b)', back: 'a^2 - b^2' },
    { cat: '곱셈공식', name: '곱셈공식 ③ x의 계수가 1인 두 일차식의 곱', front: '(x+a)(x+b)', back: 'x^2 + (a+b)x + ab' },
    { cat: '곱셈공식', name: '곱셈공식 ④ x의 계수가 1이 아닌 두 일차식의 곱', front: '(ax+b)(cx+d)', back: 'acx^2 + (ad+bc)x + bd' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (a+b, ab를 알 때)', front: 'a^2+b^2', back: '(a+b)^2 - 2ab' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (a−b, ab를 알 때)', front: 'a^2+b^2', back: '(a-b)^2 + 2ab' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형', front: '(a-b)^2', back: '(a+b)^2 - 4ab' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (분수 꼴)', front: 'x^2 + \\dfrac{1}{x^2}', back: '\\left(x+\\dfrac{1}{x}\\right)^2 - 2' },
    { cat: '수의 계산', name: '곱셈공식을 이용한 수의 계산 (제곱)', front: '101^2', back: '(100+1)^2 = 10000 + 200 + 1 = 10201' },
    { cat: '수의 계산', name: '곱셈공식을 이용한 수의 계산 (곱)', front: '99 \\times 101', back: '(100-1)(100+1) = 100^2 - 1^2 = 9999' },
    { cat: '인수분해', name: '인수분해 – 공통인수로 묶기', front: 'ma + mb', back: 'm(a+b)' },
    { cat: '인수분해', name: '인수분해 공식 ① 완전제곱식 (합)', front: 'a^2 + 2ab + b^2', back: '(a+b)^2' },
    { cat: '인수분해', name: '인수분해 공식 ① 완전제곱식 (차)', front: 'a^2 - 2ab + b^2', back: '(a-b)^2' },
    { cat: '인수분해', name: 'x² + ax + b가 완전제곱식이 되는 조건', front: 'x^2 + ax + b', back: 'b = \\left(\\dfrac{a}{2}\\right)^2', backOnly: true, backLabel: '조건' },
    { cat: '인수분해', name: '인수분해 공식 ② 합차', front: 'a^2 - b^2', back: '(a+b)(a-b)' },
    { cat: '인수분해', name: '인수분해 공식 ③', front: 'x^2 + (a+b)x + ab', back: '(x+a)(x+b)' },
    { cat: '인수분해', name: '인수분해 공식 ④', front: 'acx^2 + (ad+bc)x + bd', back: '(ax+b)(cx+d)' },
  ],
  blanks: {
    sq_plus: {
      label: '(ax+b)² 완전제곱식',
      gen() {
        const k = pick([1, 1, 2, 3]), a = randInt(1, 9);
        return { name: '완전제곱식 (a+b)²', lhs: `(${linStr(k, a)})^2`, coeffs: [k * k, 2 * k * a, a * a], cand: k === 1 ? [1, 2] : [0, 1, 2] };
      },
    },
    sq_minus: {
      label: '(ax−b)² 완전제곱식',
      gen() {
        const k = pick([1, 1, 2, 3]), a = randInt(1, 9);
        return { name: '완전제곱식 (a−b)²', lhs: `(${linStr(k, -a)})^2`, coeffs: [k * k, -2 * k * a, a * a], cand: k === 1 ? [1, 2] : [0, 1, 2] };
      },
    },
    diff_sq: {
      label: '(ax+b)(ax−b) 합차',
      gen() {
        const k = randInt(1, 3), a = randInt(1, 9);
        return { name: '합차 공식 (a+b)(a−b)', lhs: `(${linStr(k, a)})(${linStr(k, -a)})`, coeffs: [k * k, 0, -a * a], cand: k === 1 ? [2] : [0, 2] };
      },
    },
    xa_xb: {
      label: '(x+a)(x+b)',
      gen() {
        let a, b;
        do { a = randNonZero(-9, 9); b = randNonZero(-9, 9); } while (a + b === 0 || a === b);
        return { name: '(x+a)(x+b) = x² + (a+b)x + ab', lhs: `(${linStr(1, a)})(${linStr(1, b)})`, coeffs: [1, a + b, a * b], cand: [1, 2] };
      },
    },
    ax_cx: {
      label: '(ax+b)(cx+d)',
      gen() {
        let a, b, c, d;
        do {
          a = randInt(1, 4); c = randInt(1, 4); b = randNonZero(-6, 6); d = randNonZero(-6, 6);
        } while (a * d + b * c === 0 || (a === 1 && c === 1));
        return { name: '(ax+b)(cx+d) = acx² + (ad+bc)x + bd', lhs: `(${linStr(a, b)})(${linStr(c, d)})`, coeffs: [a * c, a * d + b * c, b * d], cand: [0, 1, 2] };
      },
    },
    numeric: {
      label: '수의 계산 (102², 98×102)',
      gen() {
        const base = pick([10, 20, 30, 50, 100]), a = randInt(1, 4), sg = pick([1, -1]);
        const n = base + sg * a, op = sg > 0 ? '+' : '-';
        if (Math.random() < 0.5) {
          return {
            name: '곱셈공식을 이용한 수의 계산 (완전제곱식)', answer: n * n,
            tex: (blank) => `${n}^2 = (${base} ${op} ${a})^2 = ${blank ? BOX : `${base * base} ${op} ${2 * base * a} + ${a * a} = ${n * n}`}`,
          };
        }
        return {
          name: '곱셈공식을 이용한 수의 계산 (합차 공식)', answer: base * base - a * a,
          tex: (blank) => `${base - a} \\times ${base + a} = (${base} - ${a})(${base} + ${a}) = ${blank ? BOX : `${base}^2 - ${a}^2 = ${base * base - a * a}`}`,
        };
      },
    },
    transform: {
      label: '곱셈공식의 변형 (식의 값)',
      gen: () => makeTransform([
        () => {
          const [a, b] = twoInts(), s = a + b, p = a * b;
          return { cond: `a+b=${s},\\; ab=${p}`, target: 'a^2+b^2', formula: '(a+b)^2-2ab', calc: `${P(s)}^2-2\\times${P(p)}`, ans: s * s - 2 * p };
        },
        () => {
          const [a, b] = twoInts(), s = a - b, p = a * b;
          return { cond: `a-b=${s},\\; ab=${p}`, target: 'a^2+b^2', formula: '(a-b)^2+2ab', calc: `${P(s)}^2+2\\times${P(p)}`, ans: s * s + 2 * p };
        },
        () => {
          const [a, b] = twoInts(), s = a + b, p = a * b;
          return { cond: `a+b=${s},\\; ab=${p}`, target: '(a-b)^2', formula: '(a+b)^2-4ab', calc: `${P(s)}^2-4\\times${P(p)}`, ans: s * s - 4 * p };
        },
        () => {
          const k = randInt(2, 6);
          return { cond: `x+\\dfrac{1}{x}=${k}`, target: 'x^2+\\dfrac{1}{x^2}', formula: '\\left(x+\\dfrac{1}{x}\\right)^2-2', calc: `${k}^2-2`, ans: k * k - 2 };
        },
        () => {
          const k = randNonZero(-6, 6);
          return { cond: `x-\\dfrac{1}{x}=${k}`, target: 'x^2+\\dfrac{1}{x^2}', formula: '\\left(x-\\dfrac{1}{x}\\right)^2+2', calc: `${P(k)}^2+2`, ans: k * k + 2 };
        },
      ]),
    },
  },
  factors: {
    square: {
      label: '완전제곱식',
      gen(level) {
        const p = level === 1 ? randInt(1, 9) : randNonZero(-(level === 3 ? 15 : 9), level === 3 ? 15 : 9);
        return { coeffs: [1, 2 * p, p * p], template: '(x + #)^2', answer: [p], expand: ([u]) => polyMul([1, u], [1, u]) };
      },
      hint: (f) => `상수항 ${f.coeffs[2]}은(는) ${Math.abs(f.answer[0])}의 제곱이에요. <b>a² ± 2ab + b² = (a ± b)²</b> 을 떠올려 보세요.`,
    },
    diff: {
      label: '합차 (a² − b²)',
      gen(level) {
        const a = randInt(1, level === 3 ? 15 : 9);
        return { coeffs: [1, 0, -a * a], template: '(x + #)(x + #)', answer: [a, -a], expand: ([u, v]) => polyMul([1, u], [1, v]) };
      },
      hint: (f) => `<b>x² − ${f.answer[0]}²</b> 꼴이에요. <b>a² − b² = (a + b)(a − b)</b> 를 떠올려 보세요.`,
    },
    general: {
      label: 'x² + (a+b)x + ab',
      gen(level) {
        const R = level === 3 ? 15 : 9;
        const num = () => (level === 1 ? randInt(1, 9) : randNonZero(-R, R));
        let p, q;
        do { p = num(); q = num(); } while (p === q || p === -q);
        return { coeffs: [1, p + q, p * q], template: '(x + #)(x + #)', answer: [p, q].sort((m, n) => n - m), expand: ([u, v]) => polyMul([1, u], [1, v]) };
      },
      hint: (f) => `<b>곱해서 ${f.coeffs[2]}</b>, <b>더해서 ${f.coeffs[1]}</b>가 되는 두 정수를 찾아보세요.`,
    },
    ax2: {
      label: 'acx² + (ad+bc)x + bd',
      gen(level) {
        const R = level === 1 ? 4 : level === 2 ? 5 : 9;
        let a, b, c, d;
        do {
          a = randInt(1, 3); c = randInt(1, 3);
          b = level === 1 ? randInt(1, R) : randNonZero(-R, R);
          d = level === 1 ? randInt(1, R) : randNonZero(-R, R);
        } while ((a === 1 && c === 1) || gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d + b * c === 0);
        return { coeffs: [a * c, a * d + b * c, b * d], template: '(#x + #)(#x + #)', answer: [a, b, c, d], expand: ([p, q, r, s]) => polyMul([p, q], [r, s]) };
      },
      hint: (f) => `<b>크로스(대각선) 방법</b>: x²의 계수 ${f.coeffs[0]}와 상수항 ${f.coeffs[2]}를 각각 두 수의 곱으로 나누고, 대각선으로 곱해 더한 값이 ${f.coeffs[1]}이 되는 조합을 찾아보세요.`,
    },
  },
};

/* =================== 고등학교 1학년 =================== */
const H1 = {
  key: 'h1',
  short: '고1',
  title: '고등학교 1학년',
  unit: '공통수학1 · 다항식 (곱셈공식과 인수분해)',
  sample: '(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3',
  topics: ['세제곱 공식', '(a+b+c)²', '세제곱의 합·차', '곱셈공식의 변형', '치환·복이차식', '인수정리'],
  formulas: [
    { cat: '곱셈공식', name: '곱셈공식 – 세 항의 제곱', front: '(a+b+c)^2', back: 'a^2+b^2+c^2+2ab+2bc+2ca' },
    { cat: '곱셈공식', name: '곱셈공식 – 세제곱 (합)', front: '(a+b)^3', back: 'a^3 + 3a^2b + 3ab^2 + b^3' },
    { cat: '곱셈공식', name: '곱셈공식 – 세제곱 (차)', front: '(a-b)^3', back: 'a^3 - 3a^2b + 3ab^2 - b^3' },
    { cat: '곱셈공식', name: '곱셈공식 – 세제곱의 합', front: '(a+b)(a^2-ab+b^2)', back: 'a^3 + b^3' },
    { cat: '곱셈공식', name: '곱셈공식 – 세제곱의 차', front: '(a-b)(a^2+ab+b^2)', back: 'a^3 - b^3' },
    { cat: '곱셈공식', name: '곱셈공식 – 세 일차식의 곱', front: '(x+a)(x+b)(x+c)', back: 'x^3 + (a+b+c)x^2 + (ab+bc+ca)x + abc' },
    { cat: '곱셈공식', name: '곱셈공식', front: '(a+b+c)(a^2+b^2+c^2-ab-bc-ca)', back: 'a^3+b^3+c^3-3abc' },
    { cat: '곱셈공식', name: '곱셈공식', front: '(a^2+ab+b^2)(a^2-ab+b^2)', back: 'a^4 + a^2b^2 + b^4' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (세 문자)', front: 'a^2+b^2+c^2', back: '(a+b+c)^2 - 2(ab+bc+ca)' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (세제곱의 합)', front: 'a^3+b^3', back: '(a+b)^3 - 3ab(a+b)' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (세제곱의 차)', front: 'a^3-b^3', back: '(a-b)^3 + 3ab(a-b)' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (분수 꼴)', front: 'x^3+\\dfrac{1}{x^3}', back: '\\left(x+\\dfrac{1}{x}\\right)^3 - 3\\left(x+\\dfrac{1}{x}\\right)' },
    { cat: '곱셈공식의 변형', name: '곱셈공식의 변형 (분수 꼴)', front: 'x^3-\\dfrac{1}{x^3}', back: '\\left(x-\\dfrac{1}{x}\\right)^3 + 3\\left(x-\\dfrac{1}{x}\\right)' },
    { cat: '인수분해', name: '인수분해 공식 – 세 항의 완전제곱식', front: 'a^2+b^2+c^2+2ab+2bc+2ca', back: '(a+b+c)^2' },
    { cat: '인수분해', name: '인수분해 공식 – 완전세제곱식 (합)', front: 'a^3+3a^2b+3ab^2+b^3', back: '(a+b)^3' },
    { cat: '인수분해', name: '인수분해 공식 – 완전세제곱식 (차)', front: 'a^3-3a^2b+3ab^2-b^3', back: '(a-b)^3' },
    { cat: '인수분해', name: '인수분해 공식 – 세제곱의 합', front: 'a^3+b^3', back: '(a+b)(a^2-ab+b^2)' },
    { cat: '인수분해', name: '인수분해 공식 – 세제곱의 차', front: 'a^3-b^3', back: '(a-b)(a^2+ab+b^2)' },
    { cat: '인수분해', name: '인수분해 공식', front: 'a^3+b^3+c^3-3abc', back: '(a+b+c)(a^2+b^2+c^2-ab-bc-ca)' },
    { cat: '인수분해', name: '인수분해 공식', front: 'a^4+a^2b^2+b^4', back: '(a^2+ab+b^2)(a^2-ab+b^2)' },
    { cat: '인수분해', name: '복이차식 x⁴ + ax² + b의 인수분해', front: 'x^4 + ax^2 + b', back: 'x^2 = X\\text{로 치환}\\;\\Rightarrow\\; X^2 + aX + b', backOnly: true, backLabel: '방법' },
    { cat: '인수분해', name: '인수정리', front: 'f(\\alpha) = 0', back: 'f(\\alpha)=0 \\iff f(x) = (x-\\alpha)\\,Q(x)', backOnly: true, backLabel: '인수정리' },
  ],
  blanks: {
    cube: {
      label: '(ax±b)³ 세제곱',
      gen() {
        const k = pick([1, 1, 2]), s = pick([1, -1]) * randInt(1, 4);
        return { name: s > 0 ? '세제곱 공식 (a+b)³' : '세제곱 공식 (a−b)³', lhs: `(${linStr(k, s)})^3`, coeffs: [k ** 3, 3 * k * k * s, 3 * k * s * s, s ** 3], cand: k === 1 ? [1, 2, 3] : [0, 1, 2, 3] };
      },
    },
    sum_cube: {
      label: '세제곱의 합·차',
      gen() {
        const k = pick([1, 1, 2]), s = pick([1, -1]) * randInt(1, 5);
        return { name: s > 0 ? '세제곱의 합 (a+b)(a²−ab+b²)' : '세제곱의 차 (a−b)(a²+ab+b²)', lhs: `(${linStr(k, s)})(${polyStr([k * k, -k * s, s * s])})`, coeffs: [k ** 3, 0, 0, s ** 3], cand: k === 1 ? [3] : [0, 3] };
      },
    },
    three: {
      label: '(x+a)(x+b)(x+c)',
      gen() {
        let a, b, c;
        do { a = randNonZero(-5, 5); b = randNonZero(-5, 5); c = randNonZero(-5, 5); } while (a + b + c === 0 || a * b + b * c + c * a === 0);
        return { name: '(x+a)(x+b)(x+c) = x³ + (a+b+c)x² + (ab+bc+ca)x + abc', lhs: `(${linStr(1, a)})(${linStr(1, b)})(${linStr(1, c)})`, coeffs: [1, a + b + c, a * b + b * c + c * a, a * b * c], cand: [1, 2, 3] };
      },
    },
    quartic: {
      label: '(x²+ax+a²)(x²−ax+a²)',
      gen() {
        const a = randInt(1, 4);
        return { name: '(a²+ab+b²)(a²−ab+b²) = a⁴ + a²b² + b⁴', lhs: `(${polyStr([1, a, a * a])})(${polyStr([1, -a, a * a])})`, coeffs: [1, 0, a * a, 0, a ** 4], cand: [2, 4] };
      },
    },
    transform: {
      label: '곱셈공식의 변형 (식의 값)',
      gen: () => makeTransform([
        () => {
          const [a, b] = twoInts(), s = a + b, p = a * b;
          return { cond: `a+b=${s},\\; ab=${p}`, target: 'a^3+b^3', formula: '(a+b)^3-3ab(a+b)', calc: `${P(s)}^3-3\\times${P(p)}\\times${P(s)}`, ans: s ** 3 - 3 * p * s };
        },
        () => {
          const [a, b] = twoInts(), s = a - b, p = a * b;
          return { cond: `a-b=${s},\\; ab=${p}`, target: 'a^3-b^3', formula: '(a-b)^3+3ab(a-b)', calc: `${P(s)}^3+3\\times${P(p)}\\times${P(s)}`, ans: s ** 3 + 3 * p * s };
        },
        () => {
          const a = randInt(-5, 5), b = randInt(-5, 5), c = randInt(-5, 5);
          const s = a + b + c, t = a * b + b * c + c * a;
          return { cond: `a+b+c=${s},\\; ab+bc+ca=${t}`, target: 'a^2+b^2+c^2', formula: '(a+b+c)^2-2(ab+bc+ca)', calc: `${P(s)}^2-2\\times${P(t)}`, ans: s * s - 2 * t };
        },
        () => {
          const k = randInt(2, 5);
          return { cond: `x+\\dfrac{1}{x}=${k}`, target: 'x^3+\\dfrac{1}{x^3}', formula: '\\left(x+\\dfrac{1}{x}\\right)^3-3\\left(x+\\dfrac{1}{x}\\right)', calc: `${k}^3-3\\times${k}`, ans: k ** 3 - 3 * k };
        },
        () => {
          const k = randNonZero(-5, 5);
          return { cond: `x-\\dfrac{1}{x}=${k}`, target: 'x^3-\\dfrac{1}{x^3}', formula: '\\left(x-\\dfrac{1}{x}\\right)^3+3\\left(x-\\dfrac{1}{x}\\right)', calc: `${P(k)}^3+3\\times${P(k)}`, ans: k ** 3 + 3 * k };
        },
      ]),
    },
  },
  factors: {
    perfect_cube: {
      label: '완전세제곱식',
      gen(level) {
        const s = level === 1 ? randInt(1, 3) : randNonZero(-(level === 2 ? 4 : 6), level === 2 ? 4 : 6);
        return { coeffs: [1, 3 * s, 3 * s * s, s ** 3], template: '(x + #)^3', answer: [s], expand: ([u]) => polyMul([1, u], [1, u], [1, u]) };
      },
      hint: () => '<b>a³ ± 3a²b + 3ab² ± b³ = (a ± b)³</b> — 상수항이 어떤 수의 세제곱인지 확인해 보세요.',
    },
    cube_sum: {
      label: '세제곱의 합·차',
      gen(level) {
        const s = pick([1, -1]) * randInt(1, level === 1 ? 3 : level === 2 ? 5 : 9);
        return { coeffs: [1, 0, 0, s ** 3], template: '(x + #)(x^2 + #x + #)', answer: [s, -s, s * s], expand: ([u, v, w]) => polyMul([1, u], [1, v, w]) };
      },
      hint: (f) => `<b>x³ ${f.answer[0] > 0 ? '+' : '−'} ${Math.abs(f.answer[0])}³</b> 꼴이에요. <b>a³ ± b³ = (a ± b)(a² ∓ ab + b²)</b> 를 떠올려 보세요.`,
    },
    factor_thm: {
      label: '인수정리 (삼차식)',
      gen(level) {
        const R = level === 1 ? 3 : level === 2 ? 5 : 7;
        const r = [randNonZero(-R, R), randNonZero(-R, R), randNonZero(-R, R)].sort((m, n) => n - m);
        return { coeffs: polyMul([1, r[0]], [1, r[1]], [1, r[2]]), template: '(x + #)(x + #)(x + #)', answer: r, expand: ([u, v, w]) => polyMul([1, u], [1, v], [1, w]) };
      },
      hint: (f) => `f(x)에 상수항 ${f.coeffs[3]}의 약수(±1, ±2, …)를 대입해 <b>f(k) = 0</b>이 되는 k를 찾으세요. 그러면 <b>x − k</b>가 인수예요. 조립제법으로 나눈 뒤 남은 이차식을 인수분해하세요.`,
    },
    biquad: {
      label: '복이차식 (치환)',
      gen(level) {
        const R = level === 1 ? 5 : level === 2 ? 9 : 12;
        // x² + v 가 정수 범위에서 더 인수분해되지 않도록 (v = −k² 제외)
        const ok = (v) => v > 0 || !Number.isInteger(Math.sqrt(-v));
        let p, q;
        do { p = level === 1 ? randInt(1, R) : randNonZero(-R, R); q = level === 1 ? randInt(1, R) : randNonZero(-R, R); } while (p === q || !ok(p) || !ok(q));
        return { coeffs: [1, 0, p + q, 0, p * q], template: '(x^2 + #)(x^2 + #)', answer: [p, q].sort((m, n) => n - m), expand: ([u, v]) => polyMul([1, 0, u], [1, 0, v]) };
      },
      hint: (f) => `<b>x² = X</b>로 치환하면 <b>X² ${f.coeffs[2] < 0 ? '−' : '+'} ${Math.abs(f.coeffs[2])}X ${f.coeffs[4] < 0 ? '−' : '+'} ${Math.abs(f.coeffs[4])}</b> 이에요. 이 이차식을 먼저 인수분해해 보세요.`,
    },
    quartic_ab: {
      label: 'A² − B² 꼴 (x⁴ + a²x² + a⁴)',
      gen(level) {
        const a = randInt(1, level === 1 ? 2 : level === 2 ? 3 : 5);
        return { coeffs: [1, 0, a * a, 0, a ** 4], template: '(x^2 + #x + #)(x^2 + #x + #)', answer: [a, a * a, -a, a * a], expand: ([p, q, r, s]) => polyMul([1, p, q], [1, r, s]) };
      },
      hint: (f) => `<b>x⁴ + ${f.coeffs[2]}x² + ${f.coeffs[4]} = (x² + ${f.answer[1]})² − (${f.answer[0] === 1 ? '' : f.answer[0]}x)²</b> 로 바꾸면 <b>A² − B² = (A + B)(A − B)</b> 꼴이 돼요.`,
    },
  },
};

const CURRICULUM = { m3: M3, h1: H1 };
