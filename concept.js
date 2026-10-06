'use strict';

/* =========================================================
 *  인수 개념 학습 (‘인수 개념’ 탭)
 *  - explain : 개념 설명 HTML  ($…$ 안은 KaTeX로 렌더링)
 *  - cards   : 뒤집기 카드 { t: 짧은 제목, q: 앞면, a: 뒷면 }  (HTML, $…$ 사용 가능)
 *  - quiz    : 확인 문제 생성기 { label, gen() }
 *      gen() → { type: 'single' | 'multi' | 'blank', name, q, tex, options, answer, explain }
 *        options : [{ tex | text, ok }]   (single / multi)
 *        answer  : 정수                    (blank)
 *        tex     : 학습 내역에 표시할 식
 *  - 학년 객체(CURRICULUM.m3 / h1)에 concept 으로 붙임
 * ========================================================= */

const hl = (s) => `\\textcolor{#4f46e5}{${s}}`; // 강조 색
const uniq = (arr) => [...new Set(arr)];
const divisors = (n) => { const d = []; for (let k = 2; k < n; k++) if (n % k === 0) d.push(k); return d; };
const nonDivisors = (n) => { const d = []; for (let k = 2; k <= n / 2 + 2; k++) if (n % k !== 0) d.push(k); return d; };
// 서로 다른 0이 아닌 두 정수 (합이 0이 아님 → x항이 사라지지 않음)
function twoIntsNZ() {
  let p, q;
  do { [p, q] = twoInts(); } while (p + q === 0);
  return [p, q];
}
// 간단한 소인수분해 → TeX (예: 2^2 \times 3)
function primeTex(n) {
  const out = [];
  for (let p = 2; n > 1; p++) {
    let e = 0;
    while (n % p === 0) { n /= p; e++; }
    if (e) out.push(e === 1 ? `${p}` : `${p}^{${e}}`);
  }
  return out.join(' \\times ');
}

/* ---------------- 개념 설명 ---------------- */
const CARD = 'rounded-xl border border-slate-200 p-4';
const H3 = 'font-bold text-indigo-700 mb-2';
const EX = 'text-center text-lg my-2 overflow-x-auto';

const EXPLAIN_BASE = `
<div class="grid gap-4 sm:grid-cols-2">
  <div class="${CARD}">
    <h3 class="${H3}">① 수의 인수</h3>
    <div class="${EX}">$12 = 3 \\times 4$</div>
    <p>어떤 수를 <b>곱</b>으로 나타냈을 때, 곱해진 각각의 수 $3$, $4$를 $12$의 <b>인수</b>라고 해요.</p>
    <p class="text-sm text-slate-500 mt-2">$12 = 1\\times 12 = 2\\times 6 = 3\\times 4$ 이므로 $1, 2, 3, 4, 6, 12$는 모두 $12$의 인수예요. 수에서 ‘인수’는 <b>약수</b>와 같은 말이에요.</p>
  </div>
  <div class="${CARD}">
    <h3 class="${H3}">② 다항식의 인수</h3>
    <div class="${EX}">$x^2+5x+6 = (x+2)(x+3)$</div>
    <p>다항식을 <b>곱</b>으로 나타냈을 때, 곱해진 각각의 식 $x+2$, $x+3$을 $x^2+5x+6$의 <b>인수</b>라고 해요.</p>
    <p class="text-sm text-slate-500 mt-2">$x+2$가 인수라는 것은 $x^2+5x+6$이 $x+2$로 <b>나누어떨어진다</b>는 뜻이에요.</p>
  </div>
  <div class="${CARD}">
    <h3 class="${H3}">③ 전개 ⇄ 인수분해</h3>
    <div class="flex items-center justify-center gap-3 my-3 flex-wrap">
      <span class="rounded-lg bg-indigo-50 px-3 py-2">$(x+2)(x+3)$</span>
      <span class="flex flex-col items-center text-xs leading-tight">
        <span class="text-indigo-600 font-semibold">전개 ⟶</span>
        <span class="text-emerald-600 font-semibold">⟵ 인수분해</span>
      </span>
      <span class="rounded-lg bg-emerald-50 px-3 py-2">$x^2+5x+6$</span>
    </div>
    <p>하나의 다항식을 <b>두 개 이상의 인수의 곱</b>으로 나타내는 것이 <b>인수분해</b>예요. 전개를 거꾸로 하는 과정이죠.</p>
  </div>
  <div class="${CARD}">
    <h3 class="${H3}">④ 공통인수</h3>
    <div class="${EX}">$2x^2+6x = 2x\\cdot x + 2x\\cdot 3 = 2x(x+3)$</div>
    <p>여러 항에 <b>공통으로 들어 있는 인수</b> $2x$를 <b>공통인수</b>라고 해요. 인수분해할 때는 가장 먼저 공통인수가 있는지 확인하고 묶어요.</p>
  </div>
</div>

<div class="rounded-xl bg-sky-50 border border-sky-200 p-4 mt-4">
  <h3 class="font-bold text-sky-800 mb-2">🔍 소인수분해 vs 인수분해 — 뭐가 같고 뭐가 다를까?</h3>
  <p class="mb-3">둘 다 이름에 <b>‘인수분해’</b>가 들어 있죠? 둘 다 <b>“하나를 곱(×)으로 쪼개는 것”</b>이에요. 다만 <b>무엇을</b> 쪼개느냐가 달라요.</p>
  <div class="overflow-x-auto">
    <table class="w-full text-sm bg-white rounded-lg overflow-hidden">
      <thead class="bg-sky-100 text-sky-900">
        <tr><th class="py-2 px-2 text-left w-24"></th><th class="py-2 px-2 text-left">소인수분해 <span class="font-normal text-xs">(초등·중1)</span></th><th class="py-2 px-2 text-left">인수분해 <span class="font-normal text-xs">(중3·고1)</span></th></tr>
      </thead>
      <tbody>
        <tr class="border-t"><td class="py-2 px-2 font-semibold text-slate-500">쪼개는 것</td><td class="py-2 px-2"><b>자연수</b> (숫자)</td><td class="py-2 px-2"><b>다항식</b> (문자가 있는 식)</td></tr>
        <tr class="border-t"><td class="py-2 px-2 font-semibold text-slate-500">조각</td><td class="py-2 px-2"><b>소수</b>의 곱 (더 쪼갤 수 없는 수)</td><td class="py-2 px-2"><b>인수</b>의 곱 (더 쪼갤 수 없는 식)</td></tr>
        <tr class="border-t"><td class="py-2 px-2 font-semibold text-slate-500">예</td><td class="py-2 px-2">$12 = 2 \\times 2 \\times 3 = 2^2 \\times 3$</td><td class="py-2 px-2">$x^2+5x+6 = (x+2)(x+3)$</td></tr>
        <tr class="border-t"><td class="py-2 px-2 font-semibold text-slate-500">확인 방법</td><td class="py-2 px-2">조각을 다시 곱하면 $12$</td><td class="py-2 px-2">조각을 다시 곱하면(전개) 원래 식</td></tr>
      </tbody>
    </table>
  </div>
  <ul class="list-disc pl-5 mt-3 space-y-1.5">
    <li><b>같은 점</b>: 둘 다 “곱으로 쪼개기”예요. 쪼갠 조각이 바로 <b>인수</b>고, 조각을 다시 곱하면 원래대로 돌아와요. 그래서 둘 다 <b>더 이상 쪼갤 수 없을 때까지</b> 쪼개요.</li>
    <li><b>다른 점</b>: 소인수분해는 <b>숫자</b>를 <b>소수</b>로만 쪼개요. ($12 = 3\\times 4$는 $4$가 소수가 아니라서 소인수분해가 아니에요.) 인수분해는 <b>문자가 있는 식</b>을 쪼개고, 조각은 $x+2$처럼 <b>식</b>이에요.</li>
    <li><b>‘소인수’</b>는 “소수인 인수”라는 뜻이에요. $12$의 인수 $1,2,3,4,6,12$ 중 소수인 $2$, $3$이 소인수예요.</li>
    <li class="text-sky-900">🧱 비유: 레고를 가장 작은 블록까지 분해하는 것! 소인수분해는 <b>숫자 레고</b>, 인수분해는 <b>식 레고</b>를 분해하는 거예요.</li>
  </ul>
</div>

<div class="rounded-xl bg-amber-50 border border-amber-200 p-4 mt-4">
  <h3 class="font-bold text-amber-800 mb-2">⚠️ 헷갈리기 쉬운 것</h3>
  <ul class="list-disc pl-5 space-y-1.5">
    <li><b>항</b>은 덧셈(+, −)으로, <b>인수</b>는 곱셈(×)으로 이어져 있어요. $x^2+5x+6$에서 $5x$는 <b>항</b>이지 인수가 아니에요. 반면 $(x+2)(x+3)$에서 $x+2$는 <b>인수</b>예요.</li>
    <li>$2x(x+3)$의 인수는 $2$, $x$, $x+3$ 이에요. 이들을 곱한 $2x$, $2(x+3)$, $x(x+3)$도 인수예요. ($1$과 자기 자신도 인수)</li>
    <li>$x+2$와 $x-2$는 달라요! $x^2-4=(x+2)(x-2)$의 인수는 둘 다지만, $x^2+5x+6$의 인수는 $x+2$뿐이에요.</li>
  </ul>
</div>`;

const EXPLAIN_H1 = `
<div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mt-4">
  <h3 class="font-bold text-emerald-800 mb-2">⑤ 고1 · 인수정리와 인수</h3>
  <div class="${EX}">$f(\\alpha)=0 \\iff f(x)=(x-\\alpha)\\,Q(x)$</div>
  <p>$f(x)$에 $x=\\alpha$를 대입해서 $0$이 되면 $x-\\alpha$는 $f(x)$의 <b>인수</b>예요. 예: $f(x)=x^3-7x+6$에서 $f(1)=1-7+6=0$이므로 $x-1$은 인수. 실제로 $x^3-7x+6=(x-1)(x-2)(x+3)$ 이에요.</p>
  <p class="text-sm text-slate-600 mt-2">$x^3+8=(x+2)(x^2-2x+4)$처럼 인수는 일차식뿐 아니라 <b>이차식</b>일 수도 있어요.</p>
</div>`;

/* ---------------- 뒤집기 카드 ---------------- */
const CARDS_BASE = [
  { t: '수의 인수', q: '$12 = 3 \\times 4$ 에서 $3$과 $4$를 $12$의 무엇이라고 할까요?', a: '$12$의 <b>인수</b><div class="text-sm mt-2 opacity-80">곱해서 $12$가 되게 하는 각각의 수</div>' },
  { t: '다항식의 인수', q: '$x^2+5x+6 = (x+2)(x+3)$ 에서 $x+2$, $x+3$은?', a: '$x^2+5x+6$의 <b>인수</b><div class="text-sm mt-2 opacity-80">곱해서 원래 식이 되는 각각의 식</div>' },
  { t: '인수분해의 뜻', q: '하나의 다항식을 <b>두 개 이상의 인수의 곱</b>으로 나타내는 것은?', a: '<b>인수분해</b><div class="text-sm mt-2 opacity-80">$x^2+5x+6 \\to (x+2)(x+3)$</div>' },
  { t: '전개의 뜻', q: '$(x+2)(x+3)$을 $x^2+5x+6$으로 펼치는 것은?', a: '<b>전개</b><div class="text-sm mt-2 opacity-80">인수분해의 반대 과정</div>' },
  { t: '공통인수', q: '$2x^2+6x$의 두 항에 <b>공통으로 들어 있는 인수</b>는?', a: '<b>공통인수</b> $2x$<div class="text-sm mt-2 opacity-80">$2x^2+6x = 2x(x+3)$</div>' },
  { t: '항 vs 인수', q: '$x^2+5x+6$에서 $5x$는 <b>항</b>일까요, <b>인수</b>일까요?', a: '<b>항</b><div class="text-sm mt-2 opacity-80">덧셈으로 이어진 것은 항, 곱셈으로 이어진 것이 인수</div>' },
  { t: '인수 모두 찾기', q: '$3x(x-1)$의 인수를 모두 말해 보세요.', a: '$3,\\ x,\\ x-1$<div class="text-sm mt-2 opacity-80">그리고 이들을 곱한 $3x,\\ 3(x-1),\\ x(x-1)$도 인수 ($1$과 자기 자신도)</div>' },
  { t: '합차의 인수', q: '$x^2-9$의 인수는?', a: '$x+3$, $x-3$<div class="text-sm mt-2 opacity-80">$x^2-9=(x+3)(x-3)$</div>' },
  { t: '인수의 뜻 (나눗셈)', q: '“$x+2$가 어떤 다항식의 인수이다”라는 말의 뜻은?', a: '그 다항식이 $x+2$로 <b>나누어떨어진다</b><div class="text-sm mt-2 opacity-80">다항식 $= (x+2)\\times(\\text{다른 식})$</div>' },
  { t: '인수분해 첫 단계', q: '인수분해를 할 때 <b>가장 먼저</b> 확인할 것은?', a: '<b>공통인수</b>가 있는지!<div class="text-sm mt-2 opacity-80">있으면 먼저 묶기: $3x^2+6x = 3x(x+2)$</div>' },
  { t: '인수와 약수', q: '수에서 ‘인수’와 같은 말은?', a: '<b>약수</b><div class="text-sm mt-2 opacity-80">$12$의 인수 $=$ $12$의 약수 $= 1,2,3,4,6,12$</div>' },
  { t: '소인수분해 vs 인수분해 (공통점)', q: '<b>소인수분해</b>와 <b>인수분해</b>의 <u>같은 점</u>은?', a: '둘 다 하나를 <b>곱(×)으로 쪼개기</b><div class="text-sm mt-2 opacity-80">쪼갠 조각이 인수, 다시 곱하면 원래대로</div>' },
  { t: '소인수분해 vs 인수분해 (차이점)', q: '<b>소인수분해</b>와 <b>인수분해</b>의 <u>다른 점</u>은?', a: '소인수분해는 <b>자연수</b>를 <b>소수</b>의 곱으로,<br>인수분해는 <b>다항식</b>을 <b>인수(식)</b>의 곱으로<div class="text-sm mt-2 opacity-80">$12=2^2\\times3$ / $x^2-4=(x+2)(x-2)$</div>' },
  { t: '소인수', q: '‘<b>소인수</b>’는 무슨 뜻일까요?', a: '<b>소수인 인수</b><div class="text-sm mt-2 opacity-80">$12$의 인수 $1,2,3,4,6,12$ 중 소수인 $2, 3$</div>' },
  { t: '소인수분해인가?', q: '$12 = 3 \\times 4$ 는 <b>소인수분해</b>일까요?', a: '<b>아니요</b> — $4$는 소수가 아니에요<div class="text-sm mt-2 opacity-80">소인수분해: $12 = 2\\times2\\times3 = 2^2\\times 3$</div>' },
];
const CARDS_H1 = [
  { t: '세제곱의 합의 인수', q: '$x^3+8 = (x+2)(x^2-2x+4)$ 에서 인수는?', a: '$x+2$, $x^2-2x+4$<div class="text-sm mt-2 opacity-80">인수는 이차식일 수도 있어요</div>' },
  { t: '인수정리', q: '$f(x)$가 $x-\\alpha$를 인수로 가질 조건은?', a: '$f(\\alpha)=0$<div class="text-sm mt-2 opacity-80">인수정리</div>' },
  { t: '인수정리 (예)', q: '$f(x)=x^3-7x+6$, $f(1)=0$ 이면 $f(x)$의 인수 하나는?', a: '$x-1$<div class="text-sm mt-2 opacity-80">$x^3-7x+6=(x-1)(x-2)(x+3)$</div>' },
  { t: '인수 → 함숫값', q: '$f(x)=(x-2)\\,Q(x)$ 일 때 $f(2)$의 값은?', a: '$0$<div class="text-sm mt-2 opacity-80">$x-2$가 인수이므로 $f(2)=0\\times Q(2)=0$</div>' },
];

/* ---------------- 확인 문제 생성기 ---------------- */
const QUIZ_BASE = {
  numFactor: {
    label: '수의 인수',
    gen() {
      const n = pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45]);
      const divs = divisors(n);
      const picks = [...shuffle(divs).slice(0, 2), ...shuffle(nonDivisors(n)).slice(0, 2)].sort((a, b) => a - b);
      return {
        type: 'multi', name: '수의 인수', tex: `${n}`,
        q: `다음 중 $${n}$의 <b>인수</b>를 <u>모두</u> 고르세요.`,
        options: picks.map((k) => ({ tex: String(k), ok: n % k === 0 })),
        explain: `곱해서 $${n}$이 되게 하는 수가 $${n}$의 인수예요. $${n}$의 인수(약수)는 $${[1, ...divs, n].join(',\\ ')}$ 이에요.`,
      };
    },
  },
  polyFactor: {
    label: '다항식의 인수',
    gen() {
      const [p, q] = twoInts();
      const poly = polyStr(polyMul([1, p], [1, q]));
      const wrong = uniq(shuffle([-p, -q, p + 1, p - 1, q + 1, q - 1, 1, -1, 2, -2]).filter((r) => r !== 0 && r !== p && r !== q)).slice(0, 2);
      return {
        type: 'multi', name: '다항식의 인수', tex: poly,
        q: `다음 중 $${poly}$의 <b>인수</b>를 <u>모두</u> 고르세요.`,
        options: shuffle([p, q, ...wrong]).map((r) => ({ tex: linStr(1, r), ok: r === p || r === q })),
        explain: `$${poly} = (${linStr(1, p)})(${linStr(1, q)})$ 이므로 인수는 $${linStr(1, p)}$, $${linStr(1, q)}$ 예요. 곱해서 원래 식이 되는 각각의 식이 인수!`,
      };
    },
  },
  commonFactor: {
    label: '공통인수',
    gen() {
      const k = pick([2, 3, 5]), withX = Math.random() < 0.65;
      let a, b;
      do { a = withX ? pick([1, 2, 3]) : pick([2, 3]); b = randNonZero(-6, 6); } while (gcd(a, b) !== 1 || a === k);
      const expr = withX ? polyStr([k * a, k * b, 0]) : polyStr([k * a, k * b]);
      const cf = withX ? `${k}x` : `${k}`;
      const inner = linStr(a, b);
      const wrong = withX ? [`${k}`, 'x', a === 1 ? 'x^2' : `${k * a}x`] : [`${a}`, `${k * a}`, 'x'];
      const t1 = a === 1 ? 'x' : `${a}x`;
      return {
        type: 'single', name: '공통인수', tex: expr,
        q: `$${expr} = ${BOX}\\,(${inner})$ 으로 인수분해할 때, $${BOX}$에 들어갈 <b>공통인수</b>는?`,
        options: shuffle([cf, ...wrong]).map((t) => ({ tex: t, ok: t === cf })),
        explain: `$${expr} = ${cf}\\cdot ${t1} ${b < 0 ? '-' : '+'} ${cf}\\cdot ${Math.abs(b)}$ 이므로 두 항에 공통으로 들어 있는 $${cf}$가 공통인수예요. 공통인수는 가능한 한 크게 묶어요. $\\Rightarrow ${cf}(${inner})$`,
      };
    },
  },
  termOrFactor: {
    label: '항 vs 인수',
    gen() {
      const [p, q] = twoIntsNZ();
      const k = pick([2, 3, 4]);
      const b = p + q, c = p * q;
      const sg = (n) => (n < 0 ? '-' : '+');
      const bx = `${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
      const v = pick([
        { plain: `x^2 ${sg(b)} ${bx} ${sg(c)} ${Math.abs(c)}`, marked: `x^2 ${sg(b)} ${hl(bx)} ${sg(c)} ${Math.abs(c)}`, part: bx, isTerm: true },
        { plain: `${k}x^2 ${sg(c)} ${Math.abs(c)}`, marked: `${k}x^2 ${sg(c)} ${hl(Math.abs(c))}`, part: `${Math.abs(c)}`, isTerm: true },
        { plain: `(${linStr(1, p)})(${linStr(1, q)})`, marked: `${hl(`(${linStr(1, p)})`)}(${linStr(1, q)})`, part: linStr(1, p), isTerm: false },
        { plain: `${k}x(${linStr(1, p)})`, marked: `${hl(`${k}x`)}(${linStr(1, p)})`, part: `${k}x`, isTerm: false },
        { plain: `${k}x(${linStr(1, p)})`, marked: `${k}x${hl(`(${linStr(1, p)})`)}`, part: linStr(1, p), isTerm: false },
        { plain: `${k}(${linStr(1, p)})`, marked: `${hl(k)}(${linStr(1, p)})`, part: `${k}`, isTerm: false },
      ]);
      return {
        type: 'single', name: '항 vs 인수', tex: v.plain,
        q: `$${v.marked}$ 에서 색칠한 부분 $${hl(v.part)}$ 은(는) <b>항</b>일까요, <b>인수</b>일까요?`,
        options: [{ text: '항', ok: v.isTerm }, { text: '인수', ok: !v.isTerm }],
        explain: v.isTerm
          ? `$${v.plain}$ 은 여러 부분이 <b>덧셈(+, −)</b>으로 이어진 식이에요. 더해진 각 부분은 <b>항</b>이에요. 인수는 <b>곱셈(×)</b>으로 이어진 것!`
          : `$${v.plain}$ 은 여러 부분이 <b>곱셈(×)</b>으로 이어진 식이에요. 곱해진 각 부분이 <b>인수</b>예요. 항은 <b>덧셈(+, −)</b>으로 이어진 것!`,
      };
    },
  },
  expandOrFactor: {
    label: '전개 vs 인수분해',
    gen() {
      const [p, q] = twoInts();
      const prod = `(${linStr(1, p)})(${linStr(1, q)})`, sum = polyStr(polyMul([1, p], [1, q]));
      const expand = Math.random() < 0.5;
      const arrow = expand ? `${prod} \\;\\longrightarrow\\; ${sum}` : `${sum} \\;\\longrightarrow\\; ${prod}`;
      return {
        type: 'single', name: '전개 vs 인수분해', tex: arrow,
        q: `다음과 같이 식을 바꾸는 과정을 무엇이라고 할까요?<div class="text-center text-lg mt-3 overflow-x-auto">$${arrow}$</div>`,
        options: [{ text: '전개', ok: expand }, { text: '인수분해', ok: !expand }],
        explain: expand
          ? `인수의 곱 $${prod}$ 를 풀어서 하나의 다항식 $${sum}$ 으로 만드는 것은 <b>전개</b>예요.`
          : `하나의 다항식 $${sum}$ 을 인수의 곱 $${prod}$ 로 나타내는 것은 <b>인수분해</b>예요.`,
      };
    },
  },
  primeVsFactor: {
    label: '소인수분해 vs 인수분해',
    gen() {
      if (Math.random() < 0.6) {
        const n = pick([12, 18, 20, 24, 28, 30, 36, 45, 50]);
        const [p, q] = twoInts();
        const k = pick([2, 3, 5]);
        const v = pick([
          { tex: `${n} = ${primeTex(n)}`, prime: true },
          { tex: `${polyStr(polyMul([1, p], [1, q]))} = (${linStr(1, p)})(${linStr(1, q)})`, prime: false },
          { tex: `${polyStr([k, k * p])} = ${k}(${linStr(1, p)})`, prime: false },
          { tex: `x^2 - ${p * p} = (${linStr(1, p)})(${linStr(1, -p)})`, prime: false },
        ]);
        return {
          type: 'single', name: '소인수분해 vs 인수분해', tex: v.tex,
          q: `다음은 <b>소인수분해</b>일까요, <b>인수분해</b>일까요?<div class="text-center text-lg mt-3 overflow-x-auto">$${v.tex}$</div>`,
          options: [{ text: '소인수분해', ok: v.prime }, { text: '인수분해', ok: !v.prime }],
          explain: v.prime
            ? `<b>자연수</b>를 <b>소수</b>의 곱으로 쪼갰으니 <b>소인수분해</b>예요. (문자가 없어요!)`
            : `<b>문자가 있는 식(다항식)</b>을 <b>인수의 곱</b>으로 쪼갰으니 <b>인수분해</b>예요. 둘 다 ‘곱으로 쪼개기’라는 점은 같아요.`,
        };
      }
      // 소인수분해 빈칸: n = 2^a × □
      const a = randInt(1, 3), pr = pick([3, 5, 7]);
      const n = 2 ** a * pr;
      const twos = Array(a).fill('2').join(' \\times ');
      return {
        type: 'blank', name: '소인수분해 빈칸', tex: `${n} = ${twos} \\times ${BOX}`, answer: pr,
        q: `$${n}$을 소인수분해하면 $${n} = ${twos} \\times ${BOX}$ 이에요. $${BOX}$에 들어갈 <b>소수</b>는?`,
        explain: `$${n} = ${twos} \\times ${pr}$, 즉 $${n} = ${primeTex(n)}$ 이에요. 소인수분해는 수를 <b>소수</b>의 곱으로 쪼개는 것! 쪼갠 $2$, $${pr}$ 가 $${n}$의 <b>소인수</b>예요.`,
      };
    },
  },
  isFactor: {
    label: '인수 판별 (O/X)',
    gen() {
      if (Math.random() < 0.4) {
        const n = pick([12, 18, 20, 24, 30, 36, 42]);
        const divs = divisors(n);
        const yes = Math.random() < 0.5;
        const k = yes ? pick(divs) : pick(nonDivisors(n));
        return {
          type: 'single', name: '인수 판별 (O/X)', tex: `${k}`,
          q: `“$${k}$는 $${n}$의 인수이다.” 맞을까요?`,
          options: [{ text: '⭕ 맞다', ok: yes }, { text: '❌ 아니다', ok: !yes }],
          explain: yes
            ? `$${n} = ${k} \\times ${n / k}$ 이므로 $${k}$는 $${n}$의 인수예요.`
            : `$${n}$을 $${k}$로 나누면 나머지가 $${n % k}$ 이라 나누어떨어지지 않아요. $${n}$의 인수는 $${[1, ...divs, n].join(',\\ ')}$ 이에요.`,
        };
      }
      const [p, q] = twoInts();
      const poly = polyStr(polyMul([1, p], [1, q]));
      const yes = Math.random() < 0.5;
      const r = yes ? pick([p, q]) : pick(uniq([-p, -q, p + 1, p - 1, q + 1, q - 1, 2, -2, 3].filter((m) => m !== 0 && m !== p && m !== q)));
      return {
        type: 'single', name: '인수 판별 (O/X)', tex: poly,
        q: `“$${linStr(1, r)}$는 $${poly}$의 인수이다.” 맞을까요?`,
        options: [{ text: '⭕ 맞다', ok: yes }, { text: '❌ 아니다', ok: !yes }],
        explain: `$${poly} = (${linStr(1, p)})(${linStr(1, q)})$ 이므로 인수는 $${linStr(1, p)}$, $${linStr(1, q)}$ 예요. ${yes ? '따라서 맞아요.' : `$${linStr(1, r)}$는 인수가 아니에요. 부호까지 똑같아야 해요!`}`,
      };
    },
  },
  missingFactor: {
    label: '인수 빈칸',
    gen() {
      const [p, q] = twoInts();
      const poly = polyStr(polyMul([1, p], [1, q]));
      return {
        type: 'blank', name: '인수 빈칸 채우기', tex: poly, answer: q,
        q: `$${linStr(1, p)}$ 와 $x + ${BOX}$ 가 $${poly}$의 인수일 때, $${BOX}$에 들어갈 정수는? <span class="text-xs text-slate-400">(음수는 − 부호 포함)</span>`,
        explain: `$${poly} = (${linStr(1, p)})(${linStr(1, q)})$ 이므로 다른 한 인수는 $${linStr(1, q)}$ 예요. (곱해서 $${p * q}$, 더해서 $${p + q}$)`,
      };
    },
  },
  allFactors: {
    label: '인수 모두 찾기',
    gen() {
      const k = pick([2, 3, 5]), p = randNonZero(-6, 6);
      const expr = `${k}x(${linStr(1, p)})`;
      return {
        type: 'multi', name: '인수 모두 찾기', tex: expr,
        q: `다음 중 $${expr}$의 <b>인수</b>를 <u>모두</u> 고르세요.`,
        options: shuffle([
          { tex: `${k}`, ok: true }, { tex: 'x', ok: true }, { tex: linStr(1, p), ok: true },
          { tex: `${k}x`, ok: true }, { tex: linStr(1, -p), ok: false },
        ]),
        explain: `$${expr}$ 는 $${k}$, $x$, $${linStr(1, p)}$ 의 곱이므로 이 셋은 모두 인수예요. 이들을 곱한 $${k}x$, $${k}(${linStr(1, p)})$, $x(${linStr(1, p)})$ 도 인수예요. $${linStr(1, -p)}$ 는 곱에 들어 있지 않으므로 인수가 아니에요.`,
      };
    },
  },
};

const QUIZ_H1 = {
  cubeFactor: {
    label: '세제곱의 합·차의 인수',
    gen() {
      const s = pick([1, -1]) * randInt(1, 4);
      const poly = polyStr([1, 0, 0, s ** 3]);
      const lin = linStr(1, s), quad = polyStr([1, -s, s * s]);
      return {
        type: 'multi', name: '세제곱의 합·차의 인수', tex: poly,
        q: `다음 중 $${poly}$의 <b>인수</b>를 <u>모두</u> 고르세요.`,
        options: shuffle([
          { tex: lin, ok: true }, { tex: quad, ok: true },
          { tex: linStr(1, -s), ok: false }, { tex: polyStr([1, s, s * s]), ok: false },
        ]),
        explain: `$${poly} = (${lin})(${quad})$ 이므로 인수는 $${lin}$, $${quad}$ 예요. 인수는 일차식뿐 아니라 이차식일 수도 있어요. 부호에 주의!`,
      };
    },
  },
  factorThm: {
    label: '인수정리와 인수',
    gen() {
      let r;
      do { r = [randNonZero(-4, 4), randNonZero(-4, 4), randNonZero(-4, 4)]; } while (uniq(r).length < 3);
      const coeffs = polyMul([1, -r[0]], [1, -r[1]], [1, -r[2]]);
      const poly = polyStr(coeffs);
      const factored = r.map((m) => `(${linStr(1, -m)})`).join('');
      const v = randInt(0, 2);
      if (v === 0) {
        const a = r[0];
        const wrong = uniq([-a, a + 1, a - 1, 2 * a].filter((m) => !r.includes(m))).slice(0, 3);
        return {
          type: 'single', name: '인수정리', tex: poly,
          q: `$f(x) = ${poly}$ 에서 $f(${a}) = 0$ 이에요. 다음 중 $f(x)$의 <b>인수</b>인 것은?`,
          options: shuffle([a, ...wrong]).map((m) => ({ tex: linStr(1, -m), ok: m === a })),
          explain: `인수정리: $f(\\alpha)=0$ 이면 $x-\\alpha$ 가 $f(x)$의 인수예요. $f(${a})=0$ 이므로 ${a < 0 ? `$x-(${a})$, 즉 ` : ''}$${linStr(1, -a)}$ 가 인수예요. 실제로 $f(x) = ${factored}$ 이에요.`,
        };
      }
      if (v === 1) {
        const a = randNonZero(-5, 5);
        return {
          type: 'blank', name: '인수정리', tex: `f(x) = (${linStr(1, -a)})\\,Q(x)`, answer: 0,
          q: `$f(x)$가 $${linStr(1, -a)}$ 를 인수로 가질 때, 즉 $f(x) = (${linStr(1, -a)})\\,Q(x)$ 일 때 $f(${a})$의 값은?`,
          explain: `$f(${a}) = (${a} - ${P(a)})\\,Q(${a}) = 0 \\times Q(${a}) = 0$ 이에요. $x-\\alpha$ 가 인수이면 항상 $f(\\alpha)=0$!`,
        };
      }
      // f(a) 계산 → 0이면 x − a 가 인수
      const isRoot = Math.random() < 0.6;
      const a = isRoot ? pick(r) : pick(uniq([1, -1, 2, -2, 3].filter((m) => !r.includes(m))));
      const val = coeffs.reduce((acc, c) => acc * a + c, 0);
      return {
        type: 'blank', name: '인수정리', tex: poly, answer: val,
        q: `$f(x) = ${poly}$ 일 때 $f(${a})$의 값을 구하세요. <span class="text-xs text-slate-400">(값이 $0$이면 $${linStr(1, -a)}$ 가 인수!)</span>`,
        explain: `$f(${a}) = ${val}$ 이에요. ${isRoot ? `$0$이므로 인수정리에 따라 $${linStr(1, -a)}$ 는 $f(x)$의 인수예요.` : `$0$이 아니므로 $${linStr(1, -a)}$ 는 $f(x)$의 인수가 <b>아니에요</b>.`} 실제로 $f(x) = ${factored}$ 이에요.`,
      };
    },
  },
};

CURRICULUM.m3.concept = { explain: EXPLAIN_BASE, cards: CARDS_BASE, quiz: QUIZ_BASE, quizSize: 10 };
CURRICULUM.h1.concept = { explain: EXPLAIN_BASE + EXPLAIN_H1, cards: [...CARDS_BASE, ...CARDS_H1], quiz: { ...QUIZ_BASE, ...QUIZ_H1 }, quizSize: 12 };
