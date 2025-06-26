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

// mainForLoop();

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
  [3, 4, 5],
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

/**
 * *************************************
 * 아임포트
 */
const Impt = {
  payments: {
    0: [{ iid: 11, oid: 1 }, { iid: 12, oid: 2 }, { iid: 13, oid: 3 }],
    1: [{ iid: 14, oid: 4 }, { iid: 15, oid: 5 }, { iid: 16, oid: 6 }],
    2: [{ iid: 17, oid: 7 }, { iid: 18, oid: 8 }],
    3: [],
  },
  getPayments: page => {
    console.log(`http://...?page=${page}`);
    return delay(100, Impt.payments[page]);
  },
  cancelPayment: paymentId => Promise.resolve(`${paymentId}: 취소 완료`)
};

const getOrders = ids => delay(100, [{ id: 1 }, { id: 3 }, { id: 7 }]);

async function job() {

}
job();
