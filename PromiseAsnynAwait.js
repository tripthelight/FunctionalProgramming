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
 * 문제 : 대기 중인 작업을 개별적으로 취소할 수 있는 기능을 구현하라
 */
// 요구사항
// 1. cancelTask(id) 메서드를 추가한다.
// 2. 대기 중인(queue 안에 있는) 작업만 취소할 수 있어야 한다.
// 3. 취소된 작업은 실행되지 않고 제거한다.
// 4. cancelTask(id) 호출 시 true/false 로 성공 여부를 반환한다.
// 5. 필요하다면 onError() 를 호출할 수도 있다.

// 사용 예시
/*
const idA = queue.enqueue(async () => {
  await new Promise(r => setTimeout(r, 1000));
  console.log('✅ A 완료');
});

const idB = queue.enqueue(async () => {
  await new Promise(r => setTimeout(r, 1000));
  console.log('✅ B 완료');
});

queue.cancelTask(idB) // B 작업은 실행되지 않음
*/

// 출력 예상
// ✅ A 완료

// 구현 포인트
// - enqueue() 가 반환하는 id로 작업을 추적
// - this.queue에서 해당 id를 가진 작업을 찾아서 제거
// - this.totalTasks 도 함께 감소
// - onError() 콜백 호출 여부는 옵션

// 구현 항목 요약
// - cancelTask(id) 메서드 구현
// - queue에서 해당 작업 제거
// - 제거되었으면 true, 없으면 false 반환
// - 필요시 onError() 를 "취소됨" 에러로 호출




class TaskQueue {
  constructor({ concurrency = 1 }={}) {
    this.queue = [];

    this.aborted = false;
    this.currentControllers = new Set();

    this.activeCount = 0;
    this.concurrency = concurrency;

    this.idleCallbacks = [];

    this.totalTasks = 0;
    this.completedTasks = 0;
    this.progressCallbacks = [];

    this.taskIdCounter = 0;

    this.paused = false;
  };

  enqueue(taskFn, {
    retries = 0,
    backoff = false,
    timeout = 0,
    timeoutRetry = true,
    onSucess = () => {},
    onError = () => {},
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
      priority
    };
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.totalTasks++;
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
      onError
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
    };

    this.activeCount--;
    this.currentControllers.delete(controller);

    this.completedTasks++;
    this.#emitProgress();

    this.#processQueue();
    this.#checkIdle();
  };

  #wrapWithTimeout(fn, timeout) {
    if (timeout === undefined) return fn();

    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error(`💥 타임아웃 발생`);
          err.name = 'TimeoutError';
          reject(err);
        }, timeout);
      })
    ]);
  };

  async #retryAsync(fn, retries, backoff, timeoutRetry) {
    let attempt = 0;
    const baseDelay = 200;
    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        if (error.name === 'TimeoutError' && !timeoutRetry) throw error;
        if (attempt >= retries) throw error;
        attempt++;
        const delay = backoff ? baseDelay * 2 ** (attempt - 1) : baseDelay;
        console.warn(`⏰ ${delay}ms 후 재시도 (${attempt}/${retries})`);
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
      while (this.idleCallbacks.length > 0) {
        const cb = this.idleCallbacks.shift();
        cb();
      };
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
    console.warn(`🔄 작업 ID ${taskId}의 우선순의가 ${newPriority}(으)로 변경되었습니다.`);
    return true;
  };

  pause() {
    console.warn(`🔒 전체 작업 중지`);
    this.paused = true;
  };
  resume() {
    if (this.paused) {
      console.warn(`🔓🔑 전체 작업 재개`);
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
      console.warn(`🚫 작업 ID ${taskId}는 대기중이 아니어서 취소할 수 없습니다.`);
      return false;
    };

    const [removedTask] = this.queue.splice(index, 1);
    this.totalTasks--;

    if (emitError) {
      const cancelError = new Error(`📦 작업 ID ${taskId}가 취소되었습니다.`);
      cancelError.name = 'CanceledError';
      removedTask.onError(cancelError);
    };

    console.warn(`📦 작업 ID ${taskId}가 취소됨`);
    return true;
  };
};

function createTask (id, failTimes = 0) {
  console.log(`👠 작업 ${id} 시작됨`);
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
    console.log('📌 작업 A 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('📌 작업 A 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('📌 작업 A 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('📌 작업 A 취소 → ', err.message);
    } else {
      console.error('📌 작업 A 실패 → ', err.message);
    };
  },
  priority: 1
});

const idB = q.enqueue(createTask('B', 2), {
  retries: 3,
  backoff: true,
  timeout: 100 * 99,
  timeoutRetry: false,
  onSucess: (res) => {
    console.log('📌 작업 B 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('📌 작업 B 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('📌 작업 B 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('📌 작업 B 취소 → ', err.message);
    } else {
      console.error('📌 작업 B 실패 → ', err.message);
    };
  },
  priority: 10
});

const idC = q.enqueue(createTask('C', 2), {
  retries: 3,
  backoff: true,
  timeout: 100 * 99,
  timeoutRetry: false,
  onSucess: (res) => {
    console.log('📌 작업 C 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('📌 작업 C 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('📌 작업 C 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('📌 작업 C 취소 → ', err.message);
    } else {
      console.error('📌 작업 C 실패 → ', err.message);
    };
  },
  priority: 5
});

const idD = q.enqueue(createTask('D', 2), {
  retries: 3,
  backoff: true,
  timeout: 100 * 99,
  timeoutRetry: false,
  onSucess: (res) => {
    console.log('📌 작업 D 성공 → ', res);
  },
  onError: (err) => {
    if (err.name === 'AbortError') {
      console.warn('📌 작업 D 중단 → ', err.message);
    } else if (err.name === 'TimeoutError') {
      console.warn('📌 작업 D 타임아웃 → ', err.message);
    } else if (err.name === 'CanceledError') {
      console.warn('📌 작업 D 취소 → ', err.message);
    } else {
      console.error('📌 작업 D 실패 → ', err.message);
    };
  },
  priority: 10
});

q.cancelTask(idC, { emitError: true });
q.cancelTask(idD, { emitError: false });

q.pause();
setTimeout(() => { if (q.isPaused) { q.resume(); }; }, 3000);

setTimeout(() => { q.changePriority(idD, 100); }, 100);

// setTimeout(() => q.abortAll(), 100 * 40);

q.onIdle(() => { console.log('🟢 모든 작업 완료됨'); });