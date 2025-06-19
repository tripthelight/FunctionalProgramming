const log = console.log;

/**
 * *************************************
 * 명령형 코드
 */
// 리스트에서 홀수를 length 만큼 봅아서 제곱한 후 모두 더하기
function fForLoop(list, length) {
  let i = 0;
  let res = 0;
  for (const a of list) {
    if (a % 2) {
      res = res + a * a;
      if (++i == length) break;
    }
  }
  log(res);
}

function mainForLoop() {
  fForLoop([1, 2, 3, 4, 5], 1);
  fForLoop([1, 2, 3, 4, 5], 2);
  fForLoop([1, 2, 3, 4, 5], 3);
}

// mainForLoop();

/**
 * *************************************
 * 함수형 코드
 */
const L = {};

L.range = function* (stop) {
  let i = -1;
  while(++i < stop) yield i;
}

const curry = (f) => (a, ...bs) => bs.length ? f(a, ...bs) : (...bs) => f(a, ...bs);

L.filter = curry(function* (f, iter) {
  for (const a of iter) {
    if (f(a)) yield a;
  }
})

L.map = curry(function* (f, iter) {
  for (const a of iter) {
    yield f(a);
  }
})

const take = curry(function (length, iter) {
  let res = [];
  for (const a of iter) {
    res.push(a);
    if (res.length == length) return res;
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

// log(' ///////////////////////////// ');
// log(reduce(add, 10, [10, 20, 30]));
// log(reduce(add, [10, 20, 30]));
// log(' ///////////////////////////// ');

const go1 = (a, f) => a instanceof Promise ? a.then(f) : f(a);
const go = (...fs) => reduce(go1, fs);

// log(' ///////////////////////////// ');
// go(10, a => a + 10, a => a + 1, log);
// log(' ///////////////////////////// ');

const fFp = (list, length) =>
  reduce(add, 0,
    take(length,
      L.map(a => a * a,
        L.filter(a => a % 2, list))));

const fGo = (list, length) =>
  go(list,
    L.filter(a => a % 2),
    L.map(a => a * a),
    take(length),
    reduce(add));

function mainFp() {
  log(fGo([1, 2, 3, 4, 5], 1));
  log(fGo([1, 2, 3, 4, 5], 2));
  log(fGo([1, 2, 3, 4, 5], 3));
  log(fGo(L.range(Infinity), 3));
};

// mainFp();

/**
 * *************************************
 * 2차원 배열
 */
const arr = [
  [1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10],
];

L.flat = function* (iter) {
  for (const a of iter) {
    if (a && a[Symbol.iterator]) for (const b of a) yield b;
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
);

/**
 * *************************************
 * 유저 목록
 */
const users = [
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
  L.map(u => u.family),
  L.flat,
  L.filter(u => u.age < 20),
  L.map(u => u.age),
  take(2),
  reduce(add),
  log,
);

/**
 * *************************************
 * Kleisli Composition, Promise
  - f(g(x)) = g(x)
 */
const g = JSON.parse;
const f = ({k}) => k;

const fg = x => Promise.resolve(x)
  .then(g)
  .then(f);

// fg('{"k" : 10}').then(log);
// fg('{"k : 10}').catch(_ => '미안..').then(log);

/**
 * *************************************
 * 일급, Promise, go1
 */
console.clear();
// delay
const delay = (time, a) => new Promise(resolve => 
  setTimeout(() => resolve(a), time));

// delay(100, 5).then(log);

// go1


const a = 10;
const b = delay(1000, 5);

// go1(a, log);
// go1(b, log);


async function af() {
  const b = await go(Promise.resolve(2000),
    a => a + 100,
    a => delay(1000, a + 1000),
    a => delay(1000, a + 1000));
  
  const c = await go(Promise.resolve(2000),
    a => a + 100,
    a => delay(1000, a + 1000),
    a => delay(1000, a + 1000));

  log(b, c);
}
af();