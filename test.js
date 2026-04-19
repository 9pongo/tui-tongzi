// Node.js test for 推筒子 core game logic
// Run: node test.js

// ── Core logic (mirrored from index.html) ──────────────────────────────────
function calcPoints(cards) {
  const sum = cards[0].value + cards[1].value;
  const base = Math.floor(sum) % 10;
  const half = (sum % 1) >= 0.5 ? 0.5 : 0;
  return base + half;
}

function evalHand(cards) {
  const [a, b] = cards;
  if (a.type === 'blank' && b.type === 'blank')
    return { rank: 'tianwang', pairVal: null };
  if (a.type === 'tong' && b.type === 'tong' && a.value === b.value)
    return { rank: 'pair', pairVal: a.value };
  const pts = calcPoints(cards);
  if (pts === 0) return { rank: 'bieshi', pairVal: null, points: 0 };
  return { rank: 'points', pairVal: null, points: pts };
}

const RANK_W = { tianwang: 4, pair: 3, points: 2, bieshi: 1 };

function playerBeatsDealer(pCards, dCards) {
  const p = evalHand(pCards), d = evalHand(dCards);
  if (RANK_W[p.rank] > RANK_W[d.rank]) return true;
  if (RANK_W[p.rank] < RANK_W[d.rank]) return false;
  if (p.rank === 'tianwang') return false;
  if (p.rank === 'bieshi')   return false;
  if (p.rank === 'pair') {
    if (p.pairVal > d.pairVal) return true;
    return false;
  }
  if (p.points > d.points) return true;
  if (p.points < d.points) return false;
  const pMax = Math.max(pCards[0].value, pCards[1].value);
  const dMax = Math.max(dCards[0].value, dCards[1].value);
  return pMax > dMax;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const tong  = v => ({ value: v,   type: 'tong',  label: v+'筒' });
const blank = ()  => ({ value: 0.5, type: 'blank', label: '白板' });

let passed = 0, failed = 0;
function test(desc, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓  ${desc}`);
    passed++;
  } else {
    console.error(`  ✗  ${desc}  →  got ${actual}, expected ${expected}`);
    failed++;
  }
}

// ── Test: calcPoints ───────────────────────────────────────────────────────
console.log('\ncalcPoints');
test('1+2 = 3',                   calcPoints([tong(1), tong(2)]), 3);
test('5+8 = 13 → 3',             calcPoints([tong(5), tong(8)]), 3);
test('5+5 = 10 → 0 (鱉十)',      calcPoints([tong(5), tong(5)]), 0);
test('4+6 = 10 → 0 (鱉十)',      calcPoints([tong(4), tong(6)]), 0);
test('9+白板 = 9.5 → 9.5',       calcPoints([tong(9), blank()]),  9.5);
test('1+白板 = 1.5 → 1.5',       calcPoints([tong(1), blank()]),  1.5);
test('9+1 = 10 → 0 (鱉十)',      calcPoints([tong(9), tong(1)]), 0);
test('7+白板 = 7.5',              calcPoints([tong(7), blank()]),  7.5);

// ── Test: evalHand rank ────────────────────────────────────────────────────
console.log('\nevalHand — rank');
test('天王 (兩白板)',              evalHand([blank(), blank()]).rank,    'tianwang');
test('九寶 (9對子)',               evalHand([tong(9), tong(9)]).rank,    'pair');
test('三寶 pairVal=3',            evalHand([tong(3), tong(3)]).pairVal, 3);
test('5+3 → points',              evalHand([tong(5), tong(3)]).rank,    'points');
test('5+5 → 對子（非鱉十）',       evalHand([tong(5), tong(5)]).rank,    'pair');
test('9+1 → 鱉十',                evalHand([tong(9), tong(1)]).rank,    'bieshi');
test('9+白板 → points 9.5',       evalHand([tong(9), blank()]).points,  9.5);

// ── Test: playerBeatsDealer ────────────────────────────────────────────────
console.log('\nplayerBeatsDealer');
// 天王
test('天王 > 對子',               playerBeatsDealer([blank(),blank()], [tong(9),tong(9)]),  true);
test('天王 vs 天王 → 莊贏',       playerBeatsDealer([blank(),blank()], [blank(),blank()]),  false);
// 對子 vs 對子
test('九對 > 八對',               playerBeatsDealer([tong(9),tong(9)], [tong(8),tong(8)]),  true);
test('八對 < 九對',               playerBeatsDealer([tong(8),tong(8)], [tong(9),tong(9)]),  false);
test('同對 → 莊贏',               playerBeatsDealer([tong(7),tong(7)], [tong(7),tong(7)]),  false);
// 對子 > 點數
test('一對 > 九點',               playerBeatsDealer([tong(1),tong(1)], [tong(9),blank()]),  true);
// 點數
test('9點半 > 9點',               playerBeatsDealer([tong(9),blank()], [tong(5),tong(4)]),  true);
test('8點 > 7點',                 playerBeatsDealer([tong(3),tong(5)], [tong(6),tong(1)]),  true);
test('7點 < 8點',                 playerBeatsDealer([tong(6),tong(1)], [tong(3),tong(5)]),  false);
// 同點數比最大張
test('同8點 [7+1] > [5+3]',       playerBeatsDealer([tong(7),tong(1)], [tong(5),tong(3)]),  true);
test('同8點 [5+3] < [7+1]',       playerBeatsDealer([tong(5),tong(3)], [tong(7),tong(1)]),  false);
test('同8點 同最大張 → 莊贏',     playerBeatsDealer([tong(5),tong(3)], [tong(5),tong(3)]),  false);
// 鱉十
test('3點 > 鱉十',                playerBeatsDealer([tong(2),tong(1)], [tong(4),tong(6)]),  true);
test('鱉十 vs 鱉十 → 莊贏',      playerBeatsDealer([tong(4),tong(6)], [tong(9),tong(1)]),  false);
// 莊家優勢 (平手全輸)
test('同9點 同最大張(6) → 莊贏', playerBeatsDealer([tong(6),tong(3)], [tong(6),tong(3)]), false);

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  共 ${passed+failed} 項測試：${passed} 通過，${failed} 失敗`);
if (failed > 0) process.exit(1);
