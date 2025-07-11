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


class TaskQueue {
  constructor({ concurrency = 1 } = {}) {
    this.queue = [];
    this.activeCount = 0;
    this.concurrency = concurrency;
    this.aborted = false;
    this.currentControllers = new Set();
    this.idelCallbacks = [];
  };

  abortAll() {
    this.aborted = true;
    this.queue.length = 0;
    for (const controller of this.currentControllers) {
      controller.abort();
    };
    this.currentControllers.clear();
  };

  onIdle(cb) {
    this.idelCallbacks.push(cb);
    this.#checkIdle();
  };

  // 중요도가 있는 비동기 작업이 언제 들어올 지 모름
  async enqueue(taskFn, {
    retries = 0,
    backoff = false,
    priority = 0,
    onSucess = () => {},
    onError = () => {}
  }) {
    this.queue.push({ taskFn, retries, backoff, priority, onSucess, onError });
    this.queue.sort((a, b) => b.priority - a.priority);
    this.#processQueue();
  };

  // 중요도가 있는 비동기 작업의 개수가 정해저 있어서 queue 에 한번에 모았다가 실행
  enqueueAll(taskList) {
    for (const { taskFn, ...opts } of taskList) {
      this.queue.push({ taskFn, ...opts });
    };
    this.queue.sort((a, b) => b.priority - a.priority);
    this.#processQueue();
  };

  async #processQueue() {
    if (this.aborted) return;
    if (this.activeCount >= this.concurrency) return;
    if (this.queue.length === 0) return;

    const { taskFn, retries, backoff, onSucess, onError } = this.queue.shift();

    this.activeCount++;
    const controller = new AbortController();
    const signal = controller.signal;
    this.currentControllers.add(controller);

    try {
      const result = await this.#retryAsync(() => taskFn(signal), retries, backoff);
      onSucess(result);
    } catch (error) {
      onError(error);
    };

    this.activeCount--;
    this.currentControllers.delete(controller);

    this.#processQueue();
    this.#checkIdle();
  };

  async #retryAsync(fn, retries, backoff) {
    let attempt = 0;
    const baseDelay = 200;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        if (attempt >= retries) throw error;
        attempt++;
        const delay = backoff ? baseDelay * 2 ** (attempt - 1) : baseDelay;
        console.warn(`🔁 ${delay}ms 대기 후 재실행 (${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      };
    };
  };

  #checkIdle() {
    if (this.queue.length === 0 && this.activeCount === 0) {
      while (this.idelCallbacks.length > 0) {
        const cb = this.idelCallbacks.shift();
        cb();
      }
    }
  };
};

function createTask (id, failTimes = 0) {
  let attempts = 0;
  return async (signal) => {
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        console.warn(`🛑 작업 ${id} 중단됨`);
        resolve();
      });

      if (attempts < failTimes) {
        attempts++;
        console.error(`😵 작업 ${id} 실패`);
        reject(new Error(`작업 ${id} 실패`));
        return;
      };

      setTimeout(() => {
        console.log(`✅ 작업 ${id} 성공`);
        resolve(`${id} 성공`)
      }, 500);
    });
  };
};

const q = new TaskQueue({ concurrency: 2 });

// 중요도가 있는 비동기 작업이 언제 들어올 지 모름
/*
q.enqueue(createTask('C', 2), {
  retries: 3,
  backoff: true,
  priority: 1,
  onSucess: (res) => console.log('🎉 C 작업 성공', res),
  onError: (err) => console.error('💥 C 작업 실패', err.message)
});

q.enqueue(createTask('A1', 0), {
  priority: 10,
  onSucess: (res) => console.log('🎉 A1 작업 성공', res)
});

q.enqueue(createTask('B', 1), {
  retries: 3,
  priority: 5,
  onSucess: (res) => console.log('🎉 B 작업 성공', res),
  onError: (err) => console.error('💥 B 작업 실패', err.message)
});

q.enqueue(createTask('A2', 0), {
  priority: 10,
  onSucess: (res) => console.log('🎉 A2 작업 성공', res)
});
*/

// 중요도가 있는 비동기 작업의 개수가 정해저 있어서 queue 에 한번에 모았다가 실행
q.enqueueAll([
  {
    taskFn: createTask('D', 2),
    retries: 3,
    backoff: true,
    priority: 1,
    onSucess: (res) => console.log('🎉 D 작업 성공', res),
    onError: (err) => console.error('💥 D 작업 실패', err.message)
  },
  {
    taskFn: createTask('A', 0),
    priority: 10,
    onSucess: (res) => console.log('🎉 A 작업 성공', res)
  },
  {
    taskFn: createTask('C', 1),
    retries: 3,
    priority: 5,
    onSucess: (res) => console.log('🎉 C 작업 성공', res),
    onError: (err) => console.error('💥 C 작업 실패', err.message)
  },
  {
    taskFn: createTask('B', 0),
    priority: 10,
    onSucess: (res) => console.log('🎉 B 작업 성공', res)
  },
]);

q.onIdle(() => {
  console.log('🟢 모든 작업 종료');
});
