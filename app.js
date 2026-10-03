'use strict';

/* =========================================================
 *  곱셈공식 & 인수분해 학습 웹앱
 *  - 학년(중3 / 고1)별 내용은 curriculum.js
 *  - 모든 학습 상태는 메모리(state)에만 보관 → 새로고침/기록 초기화 시 휘발
 * ========================================================= */

/* ---------------- 세션 초기화 ---------------- */
function wipeStorage() {
  try { localStorage.clear(); } catch (_) { /* 저장소 차단 환경 무시 */ }
  try { sessionStorage.clear(); } catch (_) { /* 저장소 차단 환경 무시 */ }
}
wipeStorage(); // 접속·새로고침 시 항상 초기화

// 뒤로가기 캐시(bfcache)로 복원된 경우에도 리셋
window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

const state = {
  grade: null,           // 'm3' | 'h1'
  records: [],           // 학습 내역
  streak: 0,
  flash: { order: [], idx: 0 },
  blank: null,           // 현재 빈칸 문제
  factor: null,          // 현재 인수분해 문제
};
const G = () => CURRICULUM[state.grade];

/* ---------------- 유틸 ---------------- */
const $ = (id) => document.getElementById(id);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randNonZero = (min, max) => { let v; do { v = randInt(min, max); } while (v === 0); return v; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad2 = (n) => String(n).padStart(2, '0');
function fmtTime(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function tex(el, src, displayMode = false) {
  if (window.katex) {
    katex.render(src, el, { throwOnError: false, displayMode });
  } else {
    el.textContent = src;
  }
}
// 사용자 입력 → 정수 (유니코드 마이너스 허용). 실패 시 null
function parseIntStrict(raw) {
  const s = String(raw).trim().replace(/[−–]/g, '-').replace(/\s+/g, '');
  return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null;
}

let toastTimer = null;
function toast(html, ms = 3500) {
  const el = $('toast');
  el.innerHTML = html;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  if (ms > 0) toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

/* ---------------- 다항식 표기 ---------------- */
// coeffs: 최고차항부터. blankIdx 위치는 빈칸으로 표시
function polyStr(coeffs, blankIdx = -1) {
  const n = coeffs.length - 1;
  let out = '';
  coeffs.forEach((c, i) => {
    const d = n - i;
    const varPart = d === 0 ? '' : d === 1 ? 'x' : `x^{${d}}`;
    if (i === blankIdx) {
      out += (out ? ' + ' : '') + BOX + varPart;
      return;
    }
    if (c === 0) return;
    const abs = Math.abs(c);
    const coefPart = abs === 1 && d > 0 ? '' : String(abs);
    if (!out) out = (c < 0 ? '-' : '') + coefPart + varPart;
    else out += (c < 0 ? ' - ' : ' + ') + coefPart + varPart;
  });
  return out || '0';
}
// kx + c 형태 (k ≥ 1)
function linStr(k, c) {
  const xs = k === 1 ? 'x' : `${k}x`;
  if (c === 0) return xs;
  return c > 0 ? `${xs} + ${c}` : `${xs} - ${-c}`;
}
// 인수분해 틀의 # 자리에 값 채우기: '+ #' → 부호 처리, '#x' → 계수 1 생략
function fillTemplate(template, vals) {
  let i = 0;
  return template.replace(/(\+ )?#(x(?:\^\d)?)?/g, (_, plus, v) => {
    const n = vals[i++];
    const abs = Math.abs(n);
    const num = v && abs === 1 ? '' : String(abs);
    const sign = plus ? (n < 0 ? '- ' : '+ ') : (n < 0 ? '-' : '');
    return sign + num + (v || '');
  });
}
const samePoly = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/* ---------------- 빈칸 채우기 ---------------- */
function blankTex(q, blank) {
  return q.tex ? q.tex(blank) : `${q.lhs} = ${polyStr(q.coeffs, blank ? q.blankIdx : -1)}`;
}

function newBlankQuestion() {
  const types = G().blanks;
  const type = $('blankType').value;
  const q = (type === 'all' ? pick(Object.values(types)) : types[type]).gen();
  if (q.answer === undefined) {
    q.blankIdx = pick(q.cand);
    q.answer = q.coeffs[q.blankIdx];
  }
  q.done = false;
  state.blank = q;

  $('blankFormulaName').textContent = q.name;
  tex($('blankQuestion'), blankTex(q, true), true);
  $('blankFeedback').innerHTML = '';
  $('blankInput').value = '';
  $('blankInput').disabled = false;
  $('blankInput').focus({ preventScroll: true });
}

function submitBlank() {
  const q = state.blank;
  if (!q || q.done) { newBlankQuestion(); return; }
  const val = parseIntStrict($('blankInput').value);
  if (val === null) {
    $('blankInput').classList.add('shake');
    setTimeout(() => $('blankInput').classList.remove('shake'), 300);
    $('blankFeedback').innerHTML = '<span class="text-amber-600">정수를 입력해 주세요.</span>';
    return;
  }
  const ok = val === q.answer;
  q.done = true;
  $('blankInput').disabled = true;
  addRecord({
    mode: '빈칸 채우기',
    questionTex: blankTex(q, true),
    inputTex: String(val),
    answerTex: String(q.answer),
    correct: ok,
  });

  const fb = $('blankFeedback');
  fb.innerHTML = ok
    ? '<div class="text-emerald-600 font-bold text-lg">⭕ 정답입니다!</div><div class="mt-2 overflow-x-auto" id="blankFull"></div>'
    : `<div class="text-rose-600 font-bold text-lg">❌ 아쉬워요. 정답은 <b>${q.answer}</b></div><div class="mt-2 overflow-x-auto" id="blankFull"></div><div class="text-sm text-slate-500 mt-2">Enter 또는 ‘다음 문제’를 눌러 계속하세요.</div>`;
  tex($('blankFull'), blankTex(q, false), true);
  if (ok) setTimeout(() => { if (state.blank === q) newBlankQuestion(); }, 1500);
}

/* ---------------- 인수분해 ---------------- */
const factorInputs = () => [...document.querySelectorAll('#factorForm input')];

function newFactorQuestion() {
  const kinds = G().factors;
  let kind = $('factorKind').value;
  if (kind === 'all') kind = pick(Object.keys(kinds));
  const f = kinds[kind].gen(Number($('factorLevel').value));
  Object.assign(f, { kind, result: null, revealed: false });
  state.factor = f;

  tex($('factorQuestion'), polyStr(f.coeffs), true);
  // 답안 틀: 글자 부분은 KaTeX, # 자리는 입력칸. 줄바꿈은 인수 ( ) 단위로만
  const form = $('factorForm');
  form.innerHTML = '';
  let group;
  const newGroup = () => {
    group = document.createElement('span');
    group.className = 'inline-flex items-center gap-1 whitespace-nowrap';
    form.appendChild(group);
  };
  const addText = (s) => {
    if (!s.trim()) return;
    const span = document.createElement('span');
    tex(span, s);
    group.appendChild(span);
  };
  newGroup();
  const parts = f.template.split('#');
  parts.forEach((part, i) => {
    part.split(')(').forEach((seg, j, segs) => {
      if (j > 0) newGroup();
      addText((j > 0 ? '(' : '') + seg + (j < segs.length - 1 ? ')' : ''));
    });
    if (i < parts.length - 1) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'numeric';
      inp.className = 'num-input rounded-lg border border-slate-300 px-1 py-1.5 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';
      inp.addEventListener('input', liveCheckFactor);
      inp.addEventListener('keydown', onFactorEnter);
      group.appendChild(inp);
    }
  });
  $('factorFeedback').innerHTML = '';
  factorInputs()[0].focus({ preventScroll: true });
}

function factorAnswerTex(f) {
  return `${polyStr(f.coeffs)} = ${fillTemplate(f.template, f.answer)}`;
}

function recordFactor(vals, correct) {
  const f = state.factor;
  f.result = correct;
  addRecord({
    mode: '인수분해',
    questionTex: polyStr(f.coeffs),
    inputTex: vals ? fillTemplate(f.template, vals) : '\\text{(정답 보기)}',
    answerTex: fillTemplate(f.template, f.answer),
    correct,
  });
}

function readFactorInputs() {
  const vals = factorInputs().map((el) => parseIntStrict(el.value));
  return vals.includes(null) ? null : vals;
}

// 입력할 때마다 실시간 채점: 입력한 식을 전개해서 원래 식과 비교
function liveCheckFactor() {
  const f = state.factor;
  if (!f || f.result === true || f.revealed) return;
  const fb = $('factorFeedback');
  const vals = readFactorInputs();
  if (!vals) {
    fb.innerHTML = '<span class="text-slate-400 text-sm">모든 칸을 입력하면 바로 채점돼요.</span>';
    return;
  }
  const expanded = f.expand(vals);
  if (samePoly(expanded, f.coeffs)) {
    const firstTry = f.result === null;
    if (firstTry) recordFactor(vals, true);
    else f.result = true; // 이미 오답 처리된 문제: 기록은 오답 유지
    factorInputs().forEach((el) => { el.disabled = true; });
    const kindName = G().factors[f.kind].label;
    fb.innerHTML = `<div class="${firstTry ? 'text-emerald-600' : 'text-indigo-600'} font-bold text-lg">${firstTry ? `⭕ 정답입니다! <span class="text-sm font-normal text-slate-500">(${escapeHtml(kindName)})</span>` : '👍 맞았어요! (기록은 오답 유지)'}</div><div class="mt-2 overflow-x-auto" id="factorFull"></div>`;
    tex($('factorFull'), `${polyStr(f.coeffs)} = ${fillTemplate(f.template, vals)}`, true);
    setTimeout(() => { if (state.factor === f) newFactorQuestion(); }, 1600);
  } else {
    fb.innerHTML = `<div class="text-sm text-slate-600">입력한 식을 전개하면 <span id="factorExp"></span> <span class="text-rose-500">✘</span></div>
      <div class="text-xs text-slate-400 mt-1">Enter를 누르면 이 답으로 제출(오답 기록)됩니다.</div>`;
    tex($('factorExp'), polyStr(expanded));
  }
}

// Enter: 빈 칸이 있으면 다음 칸으로, 다 채웠으면 제출
function onFactorEnter(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const empty = factorInputs().find((el) => parseIntStrict(el.value) === null);
  if (empty) { empty.focus(); return; }
  submitFactor();
}

function submitFactor() {
  const f = state.factor;
  if (!f) return;
  if (f.result === true || f.revealed) { newFactorQuestion(); return; }
  const vals = readFactorInputs();
  if (!vals || samePoly(f.expand(vals), f.coeffs)) return; // 정답은 liveCheck에서 처리
  if (f.result === null) recordFactor(vals, false);
  $('factorFeedback').innerHTML = '<div class="text-rose-600 font-bold">❌ 오답으로 기록했어요. 다시 시도하거나 힌트를 확인해 보세요.</div>';
}

/* ---------------- 플래시카드 ---------------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const FLASH_BACK_LABEL = { '곱셈공식': '전개하면', '곱셈공식의 변형': '변형하면', '수의 계산': '계산 과정', '인수분해': '인수분해하면' };
function renderFlash() {
  const card = $('flashCard');
  const formulas = G().formulas;
  const draw = () => {
    const f = formulas[state.flash.order[state.flash.idx]];
    const long = f.front.length + f.back.length > 38;
    $('flashFrontName').textContent = f.name;
    tex($('flashFront'), f.front, true);
    $('flashFront').classList.toggle('math-sm', f.front.length > 22);
    $('flashBackLabel').textContent = f.backLabel || FLASH_BACK_LABEL[f.cat];
    // 긴 공식은 두 줄로
    const back = f.backOnly ? f.back : long ? `\\begin{gathered}${f.front} \\\\ = ${f.back}\\end{gathered}` : `${f.front} = ${f.back}`;
    tex($('flashBack'), back, true);
    $('flashBack').classList.toggle('math-sm', long);
    $('flashCounter').textContent = `${state.flash.idx + 1} / ${formulas.length}`;
  };
  if (card.classList.contains('flipped')) {
    card.classList.remove('flipped');
    setTimeout(draw, 260); // 뒤집히는 동안 다음 정답이 비치지 않도록
  } else draw();
}
function moveFlash(step) {
  const n = G().formulas.length;
  state.flash.idx = (state.flash.idx + step + n) % n;
  renderFlash();
}
function selfCheckFlash(known) {
  const f = G().formulas[state.flash.order[state.flash.idx]];
  addRecord({
    mode: '플래시카드',
    questionTex: f.front,
    inputTex: known ? '\\text{외웠어요}' : '\\text{다시 볼래요}',
    answerTex: '',
    correct: null, // 자기평가 (정답률 미포함)
  });
  toast(known ? '😀 좋아요! 다음 카드로 넘어갑니다.' : '🤔 다시 볼 카드로 기록했어요.', 1500);
  moveFlash(1);
}

/* ---------------- 기록 & 통계 ---------------- */
function addRecord(r) {
  r.grade = G().short;
  r.no = state.records.length + 1;
  r.time = new Date();
  state.records.push(r);
  if (r.correct === true) state.streak += 1;
  else if (r.correct === false) state.streak = 0;
  renderStats();
  renderHistory();
}
function renderStats() {
  const graded = state.records.filter((r) => r.correct !== null);
  const correct = graded.filter((r) => r.correct).length;
  const rate = graded.length ? (correct / graded.length) * 100 : 0;
  $('statTotal').textContent = graded.length;
  $('statCorrect').textContent = correct;
  $('statRate').textContent = `${rate.toFixed(rate % 1 ? 1 : 0)}%`;
  $('statStreak').textContent = state.streak;
}
function renderHistory() {
  const body = $('historyBody');
  body.innerHTML = '';
  $('historyEmpty').classList.toggle('hidden', state.records.length > 0);
  state.records.slice().reverse().forEach((r) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b last:border-0 align-middle';
    const result = r.correct === null ? '<span class="text-slate-400">자기평가</span>'
      : r.correct ? '<span class="text-emerald-600 font-semibold">⭕ 정답</span>'
        : '<span class="text-rose-600 font-semibold">❌ 오답</span><div class="text-xs text-slate-400 whitespace-nowrap">정답 <span class="a-cell"></span></div>';
    tr.innerHTML = `<td class="py-2 pr-2 text-slate-400">${r.no}</td>
      <td class="py-2 pr-2 whitespace-nowrap">${fmtTime(r.time)}</td>
      <td class="py-2 pr-2 whitespace-nowrap">${escapeHtml(r.grade)} · ${escapeHtml(r.mode)}</td>
      <td class="py-2 pr-2 q-cell"></td>
      <td class="py-2 pr-2 i-cell"></td>
      <td class="py-2">${result}</td>`;
    tex(tr.querySelector('.q-cell'), r.questionTex);
    tex(tr.querySelector('.i-cell'), r.inputTex);
    const a = tr.querySelector('.a-cell');
    if (a) tex(a, r.answerTex);
    body.appendChild(tr);
  });
}

/* ---------------- 탭 ---------------- */
function showTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.id !== `tab-${name}`));
  if (name === 'blank') $('blankInput').focus({ preventScroll: true });
  if (name === 'factor') factorInputs()[0]?.focus({ preventScroll: true });
}

/* ---------------- 학년 선택 ---------------- */
function fillSelect(sel, allLabel, items) {
  sel.innerHTML = `<option value="all">${allLabel}</option>`
    + Object.entries(items).map(([k, v]) => `<option value="${k}">${escapeHtml(v.label)}</option>`).join('');
}

function renderGradeCards() {
  const wrap = $('gradeCards');
  wrap.innerHTML = '';
  Object.values(CURRICULUM).forEach((g) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.grade = g.key;
    const accent = g.key === 'm3' ? 'indigo' : 'emerald';
    btn.className = `grade-card group text-left bg-white rounded-2xl shadow-sm hover:shadow-lg border-2 border-transparent hover:border-${accent}-500 transition p-5 sm:p-6 flex flex-col`;
    btn.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="rounded-xl bg-${accent}-600 text-white font-bold text-xl w-14 h-14 flex items-center justify-center shrink-0">${g.short}</span>
        <div>
          <div class="font-bold text-lg">${escapeHtml(g.title)}</div>
          <div class="text-sm text-slate-500">${escapeHtml(g.unit)}</div>
        </div>
      </div>
      <div class="sample mt-4 rounded-lg bg-${accent}-50 text-${accent}-900 py-3 px-2 text-center overflow-x-auto"></div>
      <div class="mt-4 flex flex-wrap gap-1.5">${g.topics.map((t) => `<span class="text-xs rounded-full bg-slate-100 text-slate-600 px-2.5 py-1">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="mt-5 text-sm font-semibold text-${accent}-600 group-hover:translate-x-1 transition">시작하기 →</div>`;
    tex(btn.querySelector('.sample'), g.sample);
    btn.addEventListener('click', () => selectGrade(g.key));
    wrap.appendChild(btn);
  });
}

function selectGrade(key) {
  state.grade = key;
  const g = G();
  $('gradeBadge').textContent = g.short;
  $('gradeBadge').className = `ml-1 align-middle rounded text-[10px] font-semibold px-1.5 py-0.5 ${key === 'm3' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`;
  $('gradeUnit').textContent = `${g.title} · ${g.unit}`;
  fillSelect($('blankType'), '전체 공식 섞기', g.blanks);
  fillSelect($('factorKind'), '전체 유형 섞기', g.factors);
  state.flash.order = g.formulas.map((_, i) => i);
  state.flash.idx = 0;
  $('flashCard').classList.remove('flipped');
  $('startView').classList.add('hidden');
  $('mainView').classList.remove('hidden');
  renderFlash();
  newBlankQuestion();
  newFactorQuestion();
  renderStats();
  renderHistory();
  showTab('flash');
  window.scrollTo(0, 0);
}

function backToStart() {
  $('mainView').classList.add('hidden');
  $('startView').classList.remove('hidden');
  window.scrollTo(0, 0);
}

function resetAll() {
  if (state.records.length && !confirm('모든 학습 기록이 삭제됩니다. 처음부터 다시 시작할까요?')) return;
  state.records = [];
  wipeStorage();
  // 페이지를 다시 불러와 메모리·DOM을 완전히 초기 상태로
  location.replace(location.href.split(/[?#]/)[0]);
}

/* ---------------- 이벤트 바인딩 ---------------- */
function init() {
  document.querySelectorAll('.katex-inline').forEach((el) => tex(el, el.dataset.tex));
  renderGradeCards();

  $('homeBtn').addEventListener('click', backToStart);
  $('resetBtn').addEventListener('click', resetAll);
  document.querySelectorAll('.tab-btn').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

  // 플래시카드
  $('flashCard').addEventListener('click', () => $('flashCard').classList.toggle('flipped'));
  $('flashFlip').addEventListener('click', () => $('flashCard').classList.toggle('flipped'));
  $('flashPrev').addEventListener('click', () => moveFlash(-1));
  $('flashNext').addEventListener('click', () => moveFlash(1));
  $('flashShuffle').addEventListener('click', () => { state.flash.order = shuffle(state.flash.order); state.flash.idx = 0; renderFlash(); toast('🔀 카드를 섞었어요.', 1200); });
  $('flashKnow').addEventListener('click', () => selfCheckFlash(true));
  $('flashDontKnow').addEventListener('click', () => selfCheckFlash(false));

  // 빈칸 채우기
  $('blankForm').addEventListener('submit', (e) => { e.preventDefault(); submitBlank(); });
  $('blankSkip').addEventListener('click', newBlankQuestion);
  $('blankType').addEventListener('change', newBlankQuestion);
  // 채점 후 입력창이 비활성화되어도 Enter로 다음 문제
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || $('tab-blank').classList.contains('hidden') || $('mainView').classList.contains('hidden') || !state.blank?.done) return;
    if (document.activeElement === $('blankSkip')) return;
    e.preventDefault();
    newBlankQuestion();
  });

  // 인수분해
  $('factorForm').addEventListener('submit', (e) => e.preventDefault());
  $('factorNext').addEventListener('click', newFactorQuestion);
  $('factorLevel').addEventListener('change', newFactorQuestion);
  $('factorKind').addEventListener('change', newFactorQuestion);
  $('factorHint').addEventListener('click', () => {
    const f = state.factor;
    $('factorFeedback').innerHTML = `<div class="text-amber-700">💡 ${G().factors[f.kind].hint(f)}</div>`;
  });
  $('factorGiveUp').addEventListener('click', () => {
    const f = state.factor;
    if (f.result === true || f.revealed) return;
    if (f.result === null) recordFactor(null, false);
    f.revealed = true;
    factorInputs().forEach((el) => { el.disabled = true; });
    $('factorFeedback').innerHTML = '<div class="text-slate-600 mb-1">정답은</div><div class="overflow-x-auto" id="factorFull"></div>';
    tex($('factorFull'), factorAnswerTex(f), true);
  });
}

document.addEventListener('DOMContentLoaded', init);
