const log = console.log;
const wait1 = ms => x => new Promise(resolve => setTimeout(() => resolve(x), ms));
const plus = n => x => x + n;

function wait (ms) {
  const inner = function (x) {
    const promise = new Promise(resolve => {
      setTimeout(() => {
        resolve(x);
      }, ms);
    });
    return promise;
  }
  return inner;
}

// 1단계: 함수 하나부터 시작
const x = 10;
wait(500)(x).then(log); // 500ms 후 10


function pipeAsync (f) {
  return function (x) {
    return f(x)
  }
}

const process = pipeAsync(wait(500));
process(10).then(log);
