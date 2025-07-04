// [1] 각 단계 결과를 로그로 찍는 고차함수
function pipeAsyncLog(label) {
  return function (...fns) {
    return function (x) {
      return fns.reduce((acc, fn, i) => {
        return acc.then(async (accVal) => {
          const result = await fn(accVal);
          console.log(`${label} ${i + 1} :`, result);
          return result;
        });
      }, Promise.resolve(x));
    };
  };
}

// [2] 실패를 로그로 찍는 고차함수
const catchAsync = (label, f) => async x => {
  try {
    return await f(x);
  } catch (e) {
    console.error(`[에러 @ ${label}]`, e.message);
    throw e;
  }
};

// [3] 예시 유틸
const wait = ms => x => new Promise(resolve => setTimeout(() => resolve(x), ms));
const plus = n => x => x + n;

const process = pipeAsyncLog('STEP')(
  catchAsync('1단계-plus1', plus(1)),
  catchAsync('2단계-wait', wait(1000)),
  catchAsync('3단계-error', x => {
    if (x > 0) throw new Error('0보다 커서 에러 발생');
    return x;
  }),
  catchAsync('4단계-plus5', plus(5))
);

process(1)
  .then(result => console.log('최종 결과:', result))
  .catch(() => console.log('프로세스 종료'));