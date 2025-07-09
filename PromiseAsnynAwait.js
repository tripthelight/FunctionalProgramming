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


