const log = console.log;

/**
 * *************************************
 * 명령형 코드
 */
// 리스트에서 홀수를 length 만큼 뽑아서 제곱한 후 모두 더하기
function fForLoop(list, length) {
  for (const a of list) {
    log(a);
  }
}

function mainForLoop() {
  fForLoop([1, 2, 3, 4, 5], 1);
  fForLoop([1, 2, 3, 4, 5], 2);
  fForLoop([1, 2, 3, 4, 5], 3);
}

mainForLoop();

/**
 * *************************************
 * 함수형 코드
 */

function mainFp() {

};

mainFp();
