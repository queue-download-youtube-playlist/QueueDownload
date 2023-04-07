'use strict';

//-----------------------------------------------------------------------------
async function tabCloseSelf() {
  setTimeout(async () => {
    window.close();
  }, 1000);
}

async function handleTaskplaylist(message) {
  message['action'] = 'handleTaskplaylist';
  await browser.runtime.sendMessage(message);
  await tabCloseSelf();
}

/**
 * collect all vid by playlist
 * @param elementPage
 * @param playlist
 */
async function collectAllVid(elementPage, playlist) {
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
      playlist,
      datamap,
      vsum,
    };
    clearInterval(intervalIdCollect);
    await handleTaskplaylist(message);
  }, timeoutTotal);

}

//-----------------------------------------------------------------------------------

async function startFN(message) {
  let {playlist} = message;
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
          await collectAllVid(elementPage, playlist);
        }
      });
  obPage.observe(elementPage, {childList: true});

}

browser.runtime.onMessage.addListener(async (message) => {
  await startFN(message);
})
