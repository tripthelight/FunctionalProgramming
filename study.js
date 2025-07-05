// ******************************************************
// 나는 현재 promise, async, await에 대한 기초가 부족하다..
// 그에 맞게 단계별로 문제를 풀어 볼 필요가 있다.
// ******************************************************

/**
 * 문제 6-2: lazyMapAsync 구현하기
  - lazyMapAsync(f, asyncIterable) 를 구현하세요
  - 입력은 async iterable 입니다.
  - 각 항복에 f 를 적용하고 결과를 비동기 yield로 반환합니다.
 */
async function q_6_2 () {
  // 예시 실행
  async function* source() {
    yield Promise.resolve(1);
    yield Promise.resolve(2);
    yield Promise.resolve(3);
  };

  const doubleAsync = async x => x * 2;

  async function* lazyMapAsync (f, asyncIterable) {
    for await (const a of asyncIterable) {
      yield f(a);
    }
  }

  for await (const val of lazyMapAsync(doubleAsync, source())) {
    console.log(val); // 2, 4, 6
  }
};
q_6_2();

/**
 * 문제 6-3: lazyFilterAsync 구현하기
  - lazyFilterAsync(pred, asyncIterable)를 구현하세요.
  - pred는 비동기 함수일 수도 있고, 동기 함수일 수도 있습니다.
  - 조건을 만족하는 값만 비동기로 yield합니다.
 */
async function q_6_3 () {
  async function* source() {
    yield 1;
    yield Promise.resolve(2);
    yield Promise.resolve(3);
    yield 4;
    yield Promise.resolve(5);
    yield Promise.resolve(6);
    yield Promise.resolve(7);
    yield 8;
    yield Promise.resolve(9);
    yield Promise.resolve(10);
  };
  const evenAsync = async x => x % 2 === 0;
  async function* lazyFilterAsync (pred, asyncIterable) {
    for await (const a of asyncIterable) {
      if (await pred(a)) yield a;
    }
  }
  for await (const val of lazyFilterAsync(evenAsync, source())) {
    console.log(val); // 2, 4, 6, 8, 10
  }
}
// q_6_3();

/**
 * 문제 6-4: takeAsync 구현하기
  - takeAsync(n, asyncIterable)를 구현하세요.
  - 최대 n개의 값을 async iterable에서 꺼내 배열로 반환합니다.
  - for await...of 를 사용하세요.
 */
async function q_6_4 () {
  async function* source() {
    yield Promise.resolve(1);
    yield 2
    yield 3
    yield 4
    yield Promise.resolve(5);
    yield Promise.resolve(6);
  };
  async function takeAsync (n, asyncIterable) {
    let res = [];
    for await (const a of asyncIterable) {
      res.push(a);
      if (res.length === n) return res;
    }
    return res;
  }

  takeAsync(2, source()).then(console.log); // [1, 2]
}
// q_6_4();

/**
 * 문제 6-5: pipeAsyncIter 구현하기
  - pipeAsyncIter(...fns) 함수를 구현하세요.
  - 비동기 iterable을 입력받아, 각 함수를 순서대로 적용하는 함수형 파이프라인을 구성합니다.
  - lazyMapAsync, lazyFilterAsync 등을 조합하여 사용하게 됩니다.
 */
async function q_6_5 () {
  async function* source() {
    yield Promise.resolve(1);
    yield 2
    yield 3
    yield 4
    yield Promise.resolve(5);
    yield Promise.resolve(6);
  };

  const lazyMapAsync = f => async function* (iter) {
    for await (const a of iter) {
      yield f(a);
    }
  };

  const lazyFilterAsync = pred => async function* (iter) {
    for await (const a of iter) {
      if (await pred(a)) yield a;
    }
  };

  const pipeAsyncIter = (...fns) => input => fns.reduce((iter, f) => f(iter), input);

  const pipeline = pipeAsyncIter(
    lazyFilterAsync(x => x % 2 === 0), // 짝수만
    lazyMapAsync(x => x * 10)          // 10배
  );

  const asyncIter = pipeline(source());
  for await (const val of asyncIter) {
    console.log(val); // 20, 40
  }
};
// q_6_5();

// 함수에 async를 붙이니까 Promise를 return  하네???
async function pr (x) {
  return x * x;
};

// pr(2).then(console.log);


const asyncIter = {
  async *[Symbol.asyncIterator]() {
    yield 1;
    yield 2;
  }
};

for await (const item of asyncIter) {
  // console.log('item : ', item);
}
