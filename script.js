const log = console.log;

/** ***************************************************************
 * 명령형 코드
 */
/*
// 리스트에서 홀수를 length 만큼 뽑아서 제곱한 후 모두 더하기
function f(list, length) {
  let i = 0;
  let acc = 0;
  for (const a of list) {
    if (a % 2) {
      acc = acc + a * a;
      if (++i == length) break;
    }
  }
  log(acc);
}

function main() {
  // f([1, 2, 3, 4, 5], 1);
  f([1, 2, 3, 4, 5], 2);
  // f([1, 2, 3, 4, 5], 3);
}
main();
*/

/** ***************************************************************
 * 함수형 코드
 */
const curry = f => (a, ...bs) => 
  bs.length ? f(a, ...bs) : (...bs) => f(a, ...bs);

const L = {};

L.range = function *(stop) {
  let i = -1;
  while(++i < stop) yield i;
}

L.filter = curry(function *(f, iter) {
  for (const a of iter) {
    if (f(a)) yield a;
  }
})

L.map = curry(function *(f, iter) {
  for (const a of iter) {
    yield f(a);
  }
})

const take = curry(function (length, iter) {
  let res = [];
  for (const a of iter) {
    res.push(a);
    if (res.length === length) return res;
  }
  return res;
})

const reduce = curry(function (f, acc, iter) {
  if (arguments.length == 2) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }
  for (const a of iter) {
    acc = f(acc, a);
  }
  return acc;
})

const add = curry((a, b) => a + b);

const go1 = (a, f) => a instanceof Promise ? a.then(f) : f(a);
const go = (...as) => reduce(go1, as);

// go(10, a => a + 1, a => a + 10, log);

const f1 = (list, length) =>
  reduce(add, 0,
    take(length,
      L.map(a => a * a,
        L.filter((a) => a % 2, list)))
);

const f2 = (list, length) => 
  go(list,
  L.filter(a => a % 2),
  L.map(a => a * a),
  take(length),
  reduce(add));

function main() {
  // log(f2([1, 2, 3, 4, 5], 1));
  // log(f2([1, 2, 3, 4, 5], 2));
  // log(f2([1, 2, 3, 4, 5], 3));
  // log(f2(L.range(Infinity), 200));
}
main();

/** ***************************************************************
 * 2차원 배열
 */
const arr = [
  [1, 2],
  3, 4, 5,
  [6, 7, 8],
  [9, 10],
];

L.flat = function *(iter) {
  for (const a of iter) {
    if (a && a[Symbol.iterator])  yield* a;
    else yield a;
  }
}

go(arr,
  L.flat,
  L.filter(a => a % 2),
  L.map(a => a * a),
  take(3),
  reduce(add),
  log
)

/** ***************************************************************
 * 유저 목록
 */
var users = [
  { name: 'a', age: 21, family: [
    { name: 'a1', age: 53 },
    { name: 'a2', age: 47 },
    { name: 'a3', age: 16 },
    { name: 'a4', age: 14 },
  ] },
  { name: 'b', age: 24, family: [
    { name: 'b1', age: 58 },
    { name: 'b2', age: 51 },
    { name: 'b3', age: 10 },
    { name: 'b4', age: 22 },
  ] },
  { name: 'c', age: 31, family: [
    { name: 'c1', age: 64 },
    { name: 'c2', age: 62 },
  ] },
  { name: 'd', age: 20, family: [
    { name: 'd1', age: 42 },
    { name: 'd2', age: 42 },
    { name: 'd3', age: 11 },
    { name: 'd4', age: 7 },
  ] },
];

go(users,
  // L.map(u => u.family),
  // L.flat,
  L.filter(u => u.age < 30),
  L.map(u => u.age),
  take(3),
  reduce(add),
  log);

/** ***************************************************************
 * 모나드, Promise
  - f . g
  - f(g(x)) = f(g(x))
  - f(g(x)) = x
 */
function monad() {
  const g = a => a + 1;
  const f = a => a * a;

  // log(f(g(1)));
  [1].map(g).map(f).forEach(a => log(a));
  Promise.resolve(1).then(g).then(f).then(a => log(a));
}
// monad();


/** ***************************************************************
 * Kleisli Composition, Promise
- f(g(x)) = g(x)
*/
/*
const g = JSON.parse;
const f = ({k}) => k;

const fg = x => Promise.resolve(x)
  .then(g)
  .then(f);

fg('{ "k": 10 }').then(log);
fg('{ "k: 10 }').catch(_ => '미안...').then(log);
*/

/** ***************************************************************
 * 일급, Promise, go1
*/
/*
const delay = (time, a) => new Promise(resolve => 
  setTimeout(() => resolve(a), time));

// var a = delay(100, 5);
// log(a);
// log(a instanceof Promise);
// if (true) a.then(log);

const a = 10;
const b = delay(1000, 5); 
go1(a, log);
go1(b, log);

async function af() {
  var b = await go(Promise.resolve(1),
    a => a + 1,
    a => delay(100, a + 10000),
    a => delay(100, a + 10000));
  var c = await go(Promise.resolve(1),
    a => a + 1,
    a => delay(100, a + 10000),
    a => delay(100, a + 10000));

  log(b, c);
}
af();
*/

/** ***************************************************************
 * 아임포트 결제 누락 싱크
*/
console.clear();