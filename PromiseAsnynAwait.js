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






