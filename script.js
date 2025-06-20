const log = console.log;

/**
 * *************************************
 * 명령형 코드
 */
// 리스트에서 홀수를 length 만큼 뽑아서 제곱한 후 모두 더하기
function fForLoop(list, length) {
  log(list);
};

function mainForLoop() {
  fForLoop([1, 2, 3, 4, 5], 1);
  fForLoop([1, 2, 3, 4, 5], 2);
  fForLoop([1, 2, 3, 4, 5], 3);
};

mainForLoop();

/**
 * *************************************
 * 함수형 코드
 */

function mainFp() {

};

mainFp();

/**
 * *************************************
 * 2차원 배열
 */
const arr = [
  [1, 2],
  3, 4, 5,
  [6, 7, 8],
  [9, 10],
];

/**
 * *************************************
 * 유저 목록
 */
const users = [
  {name: 'a', age: 21, family: [{ name: 'a1', age: 53 }, { name: 'a2', age: 47 }, { name: 'a3', age: 16 }, { name: 'a4', age: 14 }]},
  {name: 'b', age: 24, family: [{ name: 'b1', age: 58 }, { name: 'b2', age: 51 }, { name: 'b3', age: 10 }, { name: 'b4', age: 22 }]},
  {name: 'c', age: 31, family: [{ name: 'c1', age: 64 }, { name: 'c2', age: 62 }]},
  {name: 'd', age: 20, family: [{ name: 'd1', age: 42 }, { name: 'd2', age: 42 }, { name: 'd3', age: 11 }, { name: 'd4', age: 7 }]},
];
