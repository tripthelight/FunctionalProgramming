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
 * 문제 1 : .done 메서드 구현
 */
// 요구사항
// 1. .done() 은 큐의 모든 작업이 완료되었을 때를 알려주는 Promise를 반환해야 한다.
// 2. 즉, 대기 + 실행 중인 작업이 모두 끈났을 때 .done() 이 resolve 되어야 한다.
// 3. 여러번 호출해도 동일하게 작동해야 한다.

// 사용 예시
/*
queue.enqueue(async () => {
  await wait(1000);
});

queue.enqueue(async () => {
  await wait(1000);
});

queue.done().then(() => {
  console.log('모든 작업 완료!');
});
*/

/**
 * 문제 2 : fallback() 콜백을 작업데 등록
 */
// 요구사항
// 1. 작업이 모든 재시도에도 실패했을 경우 실행할 fallback 콜백을 등록할 수 있어야 한다.
// 2. fallback은 onError() 와 별도로 실행됨
// 3. fallback은 최종 실패 이후 1회만 실행됨

// 사용 예시
/*
queue.enqueue(async () => {
  throw new Error('실패');
}, {
  retries: 3,
  fallback: () => {
    console.log('fallback: DB에 저장');
  },
  onError: (e) => {
    console.log('onError:', e.message);
  }
});
*/

// 구현 포인트 요약
// - .done() - 큐가 완전히 비었을 때 resolve 되는 PRomise
// - fallback - 최대 재시도 초과 시 실행되는 콜백 등록


class TaskQueue {
  constructor({ concurrency = 1 }={}) {
    this.queue = [];

    this.aborted = false;
    this.currentControllers = new Set();

    this.activeCount = 0;
    this.concurrency = concurrency;

    this.isIdle = true;
    this.idleCallbacks = [];

    this.totalTasks = 0;
    this.completedTasks = 0;
    this.progressCallbacks = [];

    this.taskIdCounter = 0;

    this.paused = false;

    this.doneResolvers = [];
  };

  enqueue(taskFn, {
    retries = 0,
    backoff = false,
    timeout = undefined,
    timeoutRetry = true,
    onSucess = () => {},
    onError = () => {},
    fallback = () => {},
    priority = 0
  }={}) {
    const id = ++this.taskIdCounter;
    const task = {
      id,
      taskFn,
      retries,
      backoff,
      timeout,
      timeoutRetry,
      onSucess,
      onError,
      fallback,
      priority
    };
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.totalTasks++;
    this.isIdle = false;
    this.#processQueue();
    return id;
  };

  async #processQueue() {
    if (this.paused) return;
    if (this.aborted) return;
    if (this.activeCount >= this.concurrency) return;
    if (this.queue.length === 0) return;

    const {
      taskFn,
      retries,
      backoff,
      timeout,
      timeoutRetry,
      onSucess,
      onError,
      fallback
    } = this.queue.shift();

    const controller = new AbortController();
    const signal = controller.signal;
    this.activeCount++;
    this.currentControllers.add(controller);

    try {
      const result = await this.#retryAsync(
        () => this.#wrapWithTimeout(() => taskFn(signal), timeout),
        retries,
        backoff,
        timeoutRetry
      );
      onSucess(result);
    } catch (error) {
      onError(error);
      if (error.name !== 'AbortError' && typeof fallback === 'function') {
        fallback(error);
      };
    };

    this.activeCount--;
    this.currentControllers.delete(controller);

    this.completedTasks++;
    this.#emitProgress();

    this.#processQueue();
    this.#checkIdle();
  };
  #wrapWithTimeout(fn ,timeout) {
    if (timeout === undefined) return fn();

    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error(`📛 타임아웃 발생`);
          err.name = 'TimeoutError';
          reject(err);
        }, timeout);
      })
    ]);
  };
  async #retryAsync(fn, retries, backoff, timeoutRetry) {
    let attemp = 0;
    const baseDelay = 200;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        if (error.name === 'TimeoutError' && !timeoutRetry) throw error;
        if (attemp >= retries) throw error;
        attemp++;
        const delay = backoff ? baseDelay * 2 ** (attemp - 1) : baseDelay;
        console.warn(`⏰ ${delay}ms 후 재시도 (${attemp}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      };
    };
  };

  abortAll() {
    this.aborted = true;
    this.queue.length = 0;
    for (const controller of this.currentControllers) {
      controller.abort();
    };
    this.currentControllers.clear();
  };

  onIdle(callback) {
    this.idleCallbacks.push(callback);
    this.#checkIdle();
  };
  #checkIdle() {
    if (this.queue.length === 0 && this.activeCount === 0) {
      this.isIdle = true;
      while (this.idleCallbacks.length > 0) {
        this.idleCallbacks.shift()();
      }
      while (this.doneResolvers.length > 0) {
        this.doneResolvers.shift()();
      }

      /*
      while (this.idleCallbacks.length > 0) {
        const cb = this.idleCallbacks.shift();
        cb();
      };
      */
    } else {
      this.isIdle = false;
    };
  };

  onProgress(callback) {
    this.progressCallbacks.push(callback);
  };
  #emitProgress() {
    const total = this.totalTasks;
    const completed = this.completedTasks;
    const progress = total === 0 ? 1 : completed / total;
    for (const cb of this.progressCallbacks) {
      cb({ total, completed, progress });
    };
  };

  changePriority(taskId, newPriority) {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) {
      console.warn(`🚧 작업 ID ${taskId}는 대기중인 작업이 아닙니다.`);
      return false;
    };
    task.priority = newPriority;
    this.queue.sort((a, b) => b.priority - a.priority);
    console.warn(`🔄 작업 ID ${taskId}의 우선순위가 ${newPriority}로 변경되었습니다.`);
    return true;
  };

  pause() {
    if (this.aborted) return;
    console.warn(`🔴 전체 작업 중단됨`);
    this.paused = true;
  };
  resume() {
    if (this.aborted) return;
    if (this.paused) {
      console.warn(`🔵 전체 작업 재개`);
      this.paused = false;
      this.#processQueue();
    };
  };
  get isPaused() {
    return this.paused;
  };

  cancelTask(taskId, { emitError = true }={}) {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index === -1) {
      console.warn(`🚨 작업 ID ${taskId}는 대기중인 작업이 아니어서 취소할 수 없습니다.`);
      return false;
    };
    const [removedTask] = this.queue.splice(index, 1);
    this.totalTasks--;
    if (emitError) {
      const cancelError = new Error(`🚫 작업 ID ${taskId} 취소됨`);
      cancelError.name = 'CanceledError';
      removedTask.onError(cancelError);
    };
    console.warn(`🚫 작업 ID ${taskId} 취소됨`);
    return true;
  };

  done() {
    return new Promise((resolve) => {
      if (this.isIdle) {
        resolve();
      } else {
        this.doneResolvers.push(resolve);
      }
    });
  };








};

function createTask (id, failTimes = 0) {
  console.log(`🟡 작업 ${id} 시작됨`);
  let attempts = 0;
  return async (signal) => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        const err = new Error(`🛑 작업 ${id} 중단됨`);
        err.name = 'AbortError';
        reject(err);
      };

      signal.addEventListener('abort', () => {
        const err = new Error(`🛑 작업 ${id} 중단됨`);
        err.name = 'AbortError';
        reject(err);
      });

      if (attempts < failTimes) {
        attempts++;
        reject(new Error(`❌ 작업 ${id} 실패`));
        return;
      };

      setTimeout(() => {
        resolve(`✅ 작업 ${id} 성공`);
      }, 3000);
    });
  };
};

const q = new TaskQueue({ concurrency: 2 });


q.onProgress(({ total, completed, progress }) => {
  console.log(`${completed}/${total} (${Math.round(progress * 100)}%)`);
});

const idA = q.enqueue(createTask('A', 2), {
  retries: 3,
  backoff: true,
  timeout: 100 * 99,
  timeoutRetry: false,
  onSucess: (res) => {
    console.log('🚩 작업 A 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('🚩 작업 A 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('🚩 작업 A 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('🚩 작업 A 취소 → ', err.message);
    } else {
      console.error('🚩 작업 A 실패 → ', err.message);
    };
  },
  fallback: () => { console.log('fallback A'); },
  priority: 5
});

const idB = q.enqueue(createTask('B', 2), {
  retries: 3,
  backoff: true,
  timeout: 100 * 99,
  timeoutRetry: false,
  onSucess: (res) => {
    console.log('🚩 작업 B 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('🚩 작업 B 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('🚩 작업 B 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('🚩 작업 B 취소 → ', err.message);
    } else {
      console.error('🚩 작업 B 실패 → ', err.message);
    };
  },
  fallback: () => { console.log('fallback B'); },
  priority: 10
});

const idC = q.enqueue(createTask('C', 2), {
  retries: 3,
  backoff: true,
  timeout: 100 * 99,
  timeoutRetry: false,
  onSucess: (res) => {
    console.log('🚩 작업 C 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('🚩 작업 C 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('🚩 작업 C 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('🚩 작업 C 취소 → ', err.message);
    } else {
      console.error('🚩 작업 C 실패 → ', err.message);
    };
  },
  fallback: () => { console.log('fallback C'); },
  priority: 1
});

const idD = q.enqueue(createTask('D', 2), {
  retries: 3,
  backoff: true,
  timeout: 100 * 99,
  timeoutRetry: false,
  onSucess: (res) => {
    console.log('🚩 작업 D 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('🚩 작업 D 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('🚩 작업 D 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('🚩 작업 D 취소 → ', err.message);
    } else {
      console.error('🚩 작업 D 실패 → ', err.message);
    };
  },
  fallback: () => { console.log('fallback D'); },
  priority: 10
});

// setTimeout(() => q.abortAll(), 100);

q.pause();
setTimeout(() => { if (q.isPaused) { q.resume(); }; }, 100 * 20);

setTimeout(() => { q.changePriority(idC, 100); }, 100 * 1);

setTimeout(() => { q.cancelTask(idA, { emitError: true }); }, 100 * 1);
setTimeout(() => { q.cancelTask(idB, { emitError: true }); }, 100 * 1);
setTimeout(() => { q.cancelTask(idC, { emitError: true }); }, 100 * 1);
setTimeout(() => { q.cancelTask(idD, { emitError: true }); }, 100 * 1);

q.onIdle(() => { console.log('🟢 모든 작업 완료됨'); });

q.done().then(() => { console.log('🎉 모든 작업 done'); });


/*
q.enqueue(async () => {
  await new Promise(res => setTimeout(res, 500));
  console.log("✅ A 완료");
});

q.enqueue(async () => {
  await new Promise(res => setTimeout(res, 100));
  console.log("✅ B 완료");
});

q.done().then(() => {
  console.log("🎉 모든 작업 완료!");
});
*/


