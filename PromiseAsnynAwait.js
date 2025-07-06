// ******************************************************
// 나는 지금 Date 처리가 약하다
// ******************************************************

/**
 * 고급 문제 8: throttleAsync 구현하기
  - async iterable을 받아서,
  - 지정한 시간(ms) 간격마다 1개씩만 값을 통과시키는 throttleAsync 함수를 구현하세요.
 */
function delay(val, ms) {
  return new Promise(resolve => setTimeout(() => resolve(val), ms));
}

async function* asyncGenerator() {
  for (let i = 1; i <= 5; i++) {
    yield await delay(i, 100); // 100ms 간격 생성
  }
}
// 이걸 구현하세요
async function* throttleAsync (ms, asyncIterable) {
  let lastTime = 0;

  for await (const val of asyncIterable) {
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed < ms) {
      await new Promise(resolve => setTimeout(resolve, ms - elapsed));
    };

    yield val;

    lastTime = Date.now();
  }
};

// 사용 예시
async function run() {
  const throttled = throttleAsync(300, asyncGenerator());

  const start = Date.now();
  for await (const val of throttled) {
    const elapsed = Date.now() - start;
    console.log(`[+${elapsed}ms]`, val);
    // 출력 예시:
    // [+103ms] 1
    // [+409ms] 2
    // [+713ms] 3
    // [+1018ms] 4
    // [+1322ms] 5
  }
}
run();

async function runTimeEnd() {
  for await (const val of asyncGenerator()) {
    console.time('val');
    console.log(val);
    console.timeEnd('val');
  }
}
// runTimeEnd();
async function runDateNow() {
  let prev = Date.now();
  for await (const val of asyncGenerator()) {
    const now = Date.now();
    console.log(`[+${now - prev}ms]`, val);
    prev = now;
  }
}
// runDateNow();