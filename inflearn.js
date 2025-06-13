const log = console.log;

/**
 * 일급
  - 값으로 다룰 수 있다.
  - 변수에 담을 수 있다.
  - 함수의 인자로 사용될 수 있다.
  - 함수의 결과로 사용될 수 있다.
 */
const a = 20;
const add1 = a => a + 1;
log( add1(a) );

/**
 * 일급함수
  - 함수를 값으로 다룰 수 있다.
  - 조합성과 추상화의 도구
 */
const add2 = a => a + 2;
log(add2);
const f = () => () => 1;
log(f());
const f2 = f();
log(f2());

console.clear();

/**
 * map filter reduce
 */
const products = [
  { name: '반팔티', price: 15000 },
  { name: '긴팔티', price: 20000 },
  { name: '핸드폰케이스', price: 15000 },
  { name: '후드티', price: 30000 },
  { name: '바지', price: 25000 },
];

// map
const map = (f, iter) => {
  let res = [];
  for (const a of iter) {
    res.push(f(a));
  }
  return res;
};

let names = [];
for (const product of products) {
  names.push(product.name);
}
log(names);
log(map(p => p.name, products));

let prices = [];
for (const product of products) {
  prices.push(product.price);
}
log(prices);
log(map(p => p.price, products));

// reduce
const reduce = (f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }
  for (const a of iter) {
    acc = f(acc, a);
  }
  return acc;
};

log(
  reduce(
    (total_price, product) => total_price + product.price,
    0,
    products));