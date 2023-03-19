'use strict';

//HD Image (1280 x720) --> 1280 960     maxres
//https://img.youtube.com/vi/0sm1vNgWksQ/maxresdefault.jpg

//SD Image (640 x480) ---> 1200 900     sd
//https://img.youtube.com/vi/0sm1vNgWksQ/sddefault.jpg

//Normal Image (480 x360)->1200 900     hq
//https://img.youtube.com/vi/0sm1vNgWksQ/hqdefault.jpg

//Normal Image (320 x180)->1280 960     mq
//https://img.youtube.com/vi/0sm1vNgWksQ/mqdefault.jpg

async function tabCloseSelf(timeout =1000) {
  setTimeout(async () => {
    window.close()
  }, timeout);
}

/**
 * send message to runtime backg_tab.js to update a tab
 * @param message
 */
async function tabNewOneSendData(message) {
  message['action'] = 'tabNewOneSendData';
  await browser.runtime.sendMessage(message);
  await tabCloseSelf(1)
}

async function fetchMovejpg(message) {
  setTimeout(async () => {
    message['action'] = 'fetchMovejpg';
    await browser.runtime.sendMessage(message);
    await browser.runtime.sendMessage({
      action:`sendMessageToNotice`,
      text:`image download ok`,
      close:{
        timeout:3
      }
    })
    await tabCloseSelf()
  },3000)
}

/**
 * canvas it; width 640 or 480
 */
async function canvas_640_480_to_1200x900(message) {
  let {img, vid, src} = message;

  // 640 480 --> 1200 900
  let width_t = 1200;
  let height_t = 900;

  let canvas = document.createElement('canvas');
  canvas.width = width_t;
  canvas.height = height_t;

  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width_t, height_t);

  let btn = document.createElement('button');
  btn.addEventListener('click', async function() {
    let canvasUrl = canvas.toDataURL('image/jpeg', 1.0);
    const createEl = document.createElement('a');
    createEl.href = canvasUrl;
    createEl.download = `${vid}.jpg`;
    createEl.click();
    let message = {
      vid,
      url: src,
    };
    await fetchMovejpg(message);
  });
  btn.click();
}

/**
 * canvas it; width 1280 or 320
 */
async function canvas_1280_320_to_1280x960(message) {
  let {img, vid, src} = message;

  let width_o = 1280;
  let height_o = 720;
  let diff_h = 120;
  let width_t = width_o;
  let height_t = height_o + diff_h * 2;

  let canvas = document.createElement('canvas');
  canvas.width = width_t;
  canvas.height = height_t;

  let ctx = canvas.getContext('2d');
  ctx.fillRect(0, 0, width_o, diff_h);
  ctx.fillRect(0, diff_h + height_o, width_o, diff_h);
  ctx.drawImage(img, 0, diff_h, width_o, height_o);

  let btn = document.createElement('button');
  btn.addEventListener('click', async () => {
    let canvasUrl = canvas.toDataURL('image/jpeg', 1.0);
    const createEl = document.createElement('a');
    createEl.href = canvasUrl;
    createEl.download = `${vid}.jpg`;
    createEl.click();
    let message = {
      vid,
      url: src,
    };
    await fetchMovejpg(message);
  });
  btn.click();
}

/**
 * canvas dispatch by naturalWidth
 * @param message
 */
async function canvasDispatch(message) {
  let {img, vid, src} = message;
  let {naturalWidth} = img;
  switch (naturalWidth) {
    case 1280:
    case 320:
      let message1280 = {img, vid, src};
      await canvas_1280_320_to_1280x960(message1280);
      break;
    case 640:
    case 480:
      let message1200 = {img, vid, src};
      await canvas_640_480_to_1200x900(message1200);
      break;
  }
}

/**
 * use canvas to download this image
 */
async function canvas_to_download(message) {
  let {
    src, allImg, img, vid,
  } = message;
  let regEndswith = /(?<=\/vi\/)(.+(?=\/))(\/)(.+(?=default.jpg))/;

  let ends = src.match(regEndswith)[3];
  let item = allImg[ends];

  if (item.width === img.naturalWidth) {
    let message = {img, vid, src};
    await canvasDispatch(message);
  } else {
    if (item.hasOwnProperty('next')) {
      let replaceValue = item.next;
      let srcValue = src.replace(ends, replaceValue);
      let message = {
        'url': srcValue,
        vid,
        type:`image`
      };
      await tabNewOneSendData(message);
    }
  }

}

//**********************************************************

async function startFn(message) {
  if (message.type.includes('image')) {
    let {vid} = message;
    if (vid) {

      const imgMax = {name: 'maxresdefault.jpg', width: 1280, next: 'sd'};
      const imgSd = {name: 'sddefault.jpg', width: 640, next: 'hq'};
      const imgHq = {name: 'hqdefault.jpg', width: 480, next: 'mq'};
      const imgMq = {name: 'mqdefault.jpg', width: 320};
      /**
       * image quality data
       */
      const allImg = {
        'maxres': imgMax, 'sd': imgSd, 'hq': imgHq, 'mq': imgMq,
      };
      // this page only one element, just an img.
      let img = document.querySelector('img');
      let src = img['src'];
      let message = {
        src, allImg, img, vid,
      };
      await canvas_to_download(message);
    }
  }
}

browser.runtime.onMessage.addListener(async (message) => {
  await startFn(message);
});
