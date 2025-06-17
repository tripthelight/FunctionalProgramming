const log = console.log;

const imgs = [
  { name: "HEART", url: "https://cdn.shopify.com/s/files/1/0094/2823/8432/files/b3_final.jpg" },
  { name: "HEART", url: "https://www.christineabroad.com/images/2020/03/beautiful-butterflies.jpg" },
  { name: "HEART", url: "https://i.pinimg.com/736x/05/c1/39/05c139c348d4ec7f6da4192a6353860a.jpg" },
  { name: "HEART", url: "https://i.pinimg.com/236x/f9/55/e5/f955e5f64c394627bc085d5f41762ee7.jpg" },
];
const imgs2 = [
  { name: "HEART", url: "https://cdn.shopify.com/s/files/1/0094/2823/8432/files/b3_final.jpg" },
  { name: "HEART", url: "https://www.christineabroad.com/images/2020/03/beautiful-butterflies.jpg" },
  { name: "HEART", url: "https://i.pinimg.com/736x/05/c1/39/05c139c348d4ec7f6da4192a6353860a.png" },
  { name: "HEART", url: "https://i.pinimg.com/236x/f9/55/e5/f955e5f64c394627bc085d5f41762ee7.jpg" },
];

const loadImage1 = url => new Promise((resolve, reject) => {
  let img = new Image();
  img.src = url;
  // log('이미지 로드 ', url);
  img.onload = function () {
    resolve(img);
  }
  img.onerror = function (e) {
    reject(e);
  }
  return img;
});
// loadImage(imgs[0].url).then(log);

async function f1() {
  try {
    let error = null;
    const total = await imgs2
      .map( async ({url}) => {
        if (error) return;
        try {
          const img = await loadImage1(url);
          return img.height;
        } catch (e) {
          error = e;
          log(e);
          throw e;
        }
      })
      .reduce(async (total, height) => await total + await height, 0);
  
    log(total);
  } catch (error) {
    log(0);
  }
}
// f1();

// /////////////////////////////////////////
const loadImage = url => new Promise((resolve, reject) => {
  let img = new Image();
  img.src = url;
  // log('이미지 로드 ', url);
  img.onload = function () {
    resolve(img);
  }
  img.onerror = function (e) {
    reject(e);
  }
});

function* map(f, iter) {
  for ( const a of iter ) {
    log('a : ', a)
    yield a instanceof Promise ? a.then(f) : f(a);
  }
}

async function reduceAsync (f, acc, iter) {
  for await ( const a of iter ) {
    acc = f(acc, a);
  }
  return acc;
}

const f2 = (imgs) =>
  reduceAsync((a, b) => a + b, 0,
    map((img) => img.height,
      map(({url}) => loadImage(url), imgs)));

f2(imgs).catch(_ => 0).then(log);
f2(imgs2).catch(_ => 0).then(log);
