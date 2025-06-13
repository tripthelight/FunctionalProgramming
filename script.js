const log = console.log;

/**
 * *************************************
 * 명령형 코드
 */
// 리스트에서 홀수를 length 만큼 봅아서 제곱한 후 모두 더하기
// function f1(list, length) {
//   let i = 0;
//   let acc = 0;
//   for (const a of list) {
//     if (a % 2) {
//       acc = acc + a * a;
//       if (++i == length) break;
//     }
//   }
//   log(acc)
// }

// function main() {
//   f1([1, 2, 3, 4, 5], 2);
// }

// main();

/**
 * *************************************
 * 함수형 코드
 */
function *filter(f, iter) {
  for (const a of iter) {
    if (f(a)) yield a;
  }
}

function *map(f, iter) {
  for (const a of iter) {
    yield f(a);
  }
}

function take(length, iter) {
  let res = [];
  for (const a of iter) {
    res.push(a);
    if (res.length === length) return res;
  }
  return res;
}

function reduce(f, acc, iter) {
  if (arguments.length === 2) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }
  for (const a of iter) {
    acc = f(acc, a);
  }
  return acc;
}

const add = (a, b) => a + b;

const go = (...as) => reduce(
  (a, f) => f(a), as);

go(10, a => a + 10, a => a + 1, log);

log(reduce(add, [1, 2, 3]));
log(reduce(add, 10,  [1, 2, 3]));

const f1 = (list, length) => 
  reduce(add, 0,
    take(length,
      map(a => a * a,
        filter(a => a % 2, list))));

function main() {
  log(f1([1, 2, 3, 4, 5], 2));
}

// main();