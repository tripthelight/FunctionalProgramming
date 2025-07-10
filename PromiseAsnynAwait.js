// ******************************************************
// 나는 지금 Date 처리가 약하다
// 에러 핸들링도 약하다
// 클로져는 더 약하다 - 클로져로 구성된 코드를 전혀 분석하지 못한다.
// ******************************************************

const url = 'https://jsonplaceholder.typicode.com/posts/1';
const url404 = 'https://jsonplaceholder.typicode.com/postss/1';
const urlBad = 'https://dddjsonplaceholder.typicode.com/postss/1';

// 요청이 OK가 아닐 시, 추가적으로 요청을 더 시킬 수 있다. - retryAsync
// 요청이 OK가 아닐 시, 추가적으로 더 요청을 보낼 때 time^n 만큼 축척된 delay를 줄 수 있다. - retryAsync에 backoff 기능 추가
// 요청 시작 후, 요청 대기 시간을 미리 정해서, 그 시간안에 응답이 오지 않으면 중지 시킬 수 있다. - AbortController
// 요청 시작 후, 요청 대기 시간과 재요청 회수를 미리 정해서, 미리 설정한 대기시간보다 재요청 시간이 길어질 경우 중지 시킬 수 있다.
// 1. 큐처리기를 이용해서 동기, 비동기 함수들의 순서를 강제할 수 있다.
// - AbortController ===================================== TODO: ING
// - retryAsync
// - backoff
// - concurrency 제한 (병렬 개수 제한)
// 큐처리기에 위 기능 확장 가능 ****************************** 이거 풀어보자!
// 2. 큐처리기에 비동기 데이터 흐름 처리를 감싸서 사용 가능 
// - queue.enqueue(() => runPipeOverData(asyncDataSource)); 
// 큐처리기에 비동기 pipe를 함께 사용하는 기능 ***************** 이거도 풀어보자!

// console.log(`요청 결과:\n ${JSON.stringify(result, null, 2).replace(/\\n/g, '\n')}`);

/**
다음은 retryAsync, backoff, concurrency 제한 등을 이 큐 처리기에 하나씩 덧붙이게 될 예정입니다.
계속해서 진행하실까요? 아니면 잠깐 쉬거나 복습하고 싶으신가요? 😊
 */


/**
 * 문제 : 큐 처리기에 concurrency 제한 기능을 추가하라
 */

// 조건
// 1. initQueue({ concurrency }) 를 통해 최대 동시 실행 개수를 설정할 수 있어야 한다.
//  -  예: concurrency: 3 이면, 최대 3개 작업만 동시에 실행 가능
//  -  기본값은 1 (즉, 기존 동작 그대로)
// 2. 큐에 여러 작업을 넣으면,
//  -  최대 N 개까지만 processQueue() 로 실행되고
//  -  나머지는 대기 상태로 유지되어야 함
// 3. enqueue(taskFn, options) 는 그대로 사용


const queue = [];
let working = false; // 더 이상 사용 안 해도 됨
let currentController = null;
let aborted = false;

let concurrency = 1;     // 동시 실행 제한
let activeCount = 0;     // 현재 실행 중인 작업 수

function initQueue({ concurrency: c = 1 } = {}) {
  concurrency = c;
}

function abortAll() {
  aborted = true;
  queue.length = 0;
  if (currentController) {
    currentController.abort();
  }
}

function enqueue(taskFn, { retries = 0, backoff = false } = {}) {
  queue.push({ taskFn, retries, backoff });
  processQueue();
}

async function processQueue() {
  if (aborted) return;
  if (activeCount >= concurrency) return;
  if (queue.length === 0) return;

  const { taskFn, retries, backoff } = queue.shift();

  activeCount++;

  currentController = new AbortController();
  const signal = currentController.signal;

  try {
    await retryAsync(() => taskFn(signal), retries, backoff);
  } catch (error) {
    console.error("❌ 전체 재시도 실패:", error.message);
  }

  activeCount--;
  currentController = null;

  // 다음 대기 중 작업 실행
  if (!aborted) {
    processQueue();
  }
}

// retry + baseoff 조합
async function retryAsync(fn, retries, backoff) {
  let attempt = 0;
  const baseDelay = 200;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (attempt >= retries) throw error;
      attempt++;

      const delayTime = backoff
        ? baseDelay * 2 ** (attempt - 1)
        : baseDelay;

      console.warn(`🔁 ${delayTime}ms 후 재시도 (${attempt}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delayTime));
    }
  }
}

// 사용 예시
initQueue({ concurrency: 2 }); // 최대 2개 동시 실행

function createTask(id, failTimes = 0) {
  let attempts = 0;
  return async (signal) => {
    return new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => {
        console.log(`🛑 작업 ${id} 중단됨`);
        resolve();
      });

      if (attempts < failTimes) {
        attempts++;
        console.log(`😵 작업 ${id} 실패`);
        reject(new Error(`작업 ${id} 실패`));
        return;
      }

      setTimeout(() => {
        console.log(`✅ 작업 ${id} 성공`);
        resolve();
      }, 500);
    });
  };
}

enqueue(createTask("A", 1), { retries: 3, backoff: true }); // 작업 A
enqueue(createTask("B", 0), { retries: 1 }); // 작업 B
enqueue(createTask("C", 2), { retries: 3 }); // 작업 C → A, B 실행 중이면 C는 대기
enqueue(createTask("D", 0)); // 작업 D

// 요약 : 구현 목표
// - initQueue({ concurrency }) 로 최대 동시 실행 개수 설정
// - activeCount 를 관리하여 동시 실행 수 추적
// - 실행이 끝나면 activeCount-- 후 다음 작업 호출

