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
 * 문제 정의
  - 1. Semaphore 클래스를 구현하라.
  - 2. acquire() : 자원을 점유하려는 요청. 자원이 없으면 대기 해야 함.
  - 3. release() : 자원을 반환. 대기 중인 요청이 있으면 그 중 하나를 실행
  - 4. 동시에 실행 가능한 작업 수 (limit) 를 설정할 수 있어야 함.
  - 5. 모든 작업이 완료되면, .done 이 동작해야 한다.
 */


  

class Semaphore {
  constructor(limit = 1) {
    this.limit = limit;
    this.activeCount = 0;
    this.queue = [];
    this.doneResolvers = [];
  };

  // 자원 점유
  acquire() {
    return new Promise((resolve) => {
      console.log('------- ', this.activeCount);
      
      if (this.activeCount < this.limit) {
        this.activeCount++;
        resolve();
      } else {
        this.queue.push(resolve);
      };
    })
  };

  // 자원 해제
  release() {
    this.activeCount--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.activeCount++;
      next(); // 대기중인 작업 실행
    } else if (this.activeCount === 0) {
      // 모든 작업이 끝났다면 done() 콜백 실행
      while (this.doneResolvers.length > 0) {
        this.doneResolvers.shift()();
      };
    };
  };

  // 모든 작업 완료 대기
  done() {
    return new Promise((resolve) => {
      if (this.activeCount === 0 && this.queue.length === 0) {
        resolve();
      } else {
        this.doneResolvers.push(resolve);
      };
    });
  };
};

const sem = new Semaphore(2); // 동시에 2개반 실행 가능

async function task (name, delay) {
  await sem.acquire(); // 자원 점유
  console.log(`${name} 시작`);
  await new Promise(res => setTimeout(res, delay));
  console.log(`${name} 완료`);
  sem.release(); // 자원 반환
};

task('A', 1000);
task('B', 500);
task('C', 300);
task('D', 400);

sem.done().then(() => console.log('모든 작업 완료!'));

// 예상 실행 순서
// A 시작
// B 시작
// B 완료
// C 시작
// A 완료
// D 시작
// C 완료
// D 완료
// 모든 작업 완료!






