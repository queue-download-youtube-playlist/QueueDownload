'use strict';

//-----------------------------------------------------------------------------
async function tabCloseSelf() {
  setTimeout(async () => {
    window.close();
  }, 1000);
}

async function fetchTaskplaylist(message) {
  message['action'] = 'fetchTaskplaylist';
  await browser.runtime.sendMessage(message);
  await tabCloseSelf();
}

async function sendMessageToNotice(message) {
  await browser.runtime.sendMessage({
    action: `sendMessageToNotice`,
    text: message.text,
    close: {
      timeout: 3,
    },
  });
}

/**
 * collect all vid by playlist
 * @param elementPage
 * @param queue
 */
async function collectAllVid(elementPage, queue) {
  let regExpVid = /(?<=watch\?v=)(.+)(?=\&list)/;
  let regExpVindex = /(?<=\&index=)(\d{1,10})/;
  const hrefAttr = 'href';

  const datamap = {};
  let vsum = elementPage.querySelector(
      'yt-formatted-string.byline-item > span').textContent;

  let count = 0;
  if (vsum <= 100) {
  } else {
    count += vsum / 100;
  }

  let timeout = 5000;
  let intervalId = setInterval(async () => {
    let x = 0;
    let y = elementPage.clientHeight;
    await sendMessageToNotice({text: `scrolling ... `});
    window.scrollTo(x, y);

    count = count - 1;
    if (count <= 0) {
      clearInterval(intervalId);
    }
  }, timeout);

  let timeoutTotal = (count + 1) * timeout;
  let intervalIdCollect = setInterval(async () => {
    let eleContents3 = elementPage.querySelector(
        'div.ytd-playlist-video-list-renderer:nth-child(3)');
    if (eleContents3) {
      let eleList = eleContents3.querySelectorAll(
          'ytd-playlist-video-renderer');
      eleList.forEach(value => {
        let elea = value.querySelector(
            '#content > #container > #meta > h3 > #video-title');
        let href = elea[hrefAttr];
        let matVid = href.match(regExpVid);
        let vid = matVid[0];
        let matVindex = href.match(regExpVindex);
        let vindex = matVindex[0];
        // sometimes the playlist has some repeat video
        datamap[vindex] = vid;
      });
    }

    let message = {
      queue,
      datamap,
      vsum,
    };
    clearInterval(intervalIdCollect);
    await sendMessageToNotice({text: `collect finish ... `});
    await fetchTaskplaylist(message);
  }, timeoutTotal);

}

//-----------------------------------------------------------------------------------

async function startFN(message) {
  let {queue} = message;
  let elementPage = document.querySelector(
      'ytd-page-manager#page-manager');

  // **********************************************************
  // **********************************************************
  const obPage = new MutationObserver(
      async (mutations, observer) => {
        let eleTwo = elementPage.querySelector(
            'ytd-two-column-browse-results-renderer');
        if (eleTwo) {
          observer.disconnect();
          await collectAllVid(elementPage, queue);
        }
      });
  obPage.observe(elementPage, {childList: true});

}

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type.includes('playlist')) {
    await startFN(message);
  }
});
