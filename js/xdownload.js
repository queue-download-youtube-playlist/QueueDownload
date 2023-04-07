'use strict';

async function tabCloseSelf() {
  setTimeout(async () => {
    window.close();
  }, 1);
}

async function fetchVideoPut(message) {
  message['action'] = 'fetchVideoPut';
  await browser.runtime.sendMessage(message);
  await tabCloseSelf();
}

async function fetchVideoPost(message) {
  message['action'] = 'fetchVideoPost';
  await browser.runtime.sendMessage(message);
}

async function fetchNoticeMP4(message) {
  message['action'] = 'fetchNoticeMP4';
  await browser.runtime.sendMessage(message);
  await tabCloseSelf();
}

// async function sendMessageToNotice(message) {
//   await browser.runtime.sendMessage({
//     action: `sendMessageToNotice`,
//     text: message.text,
//     close: {
//       timeout: 3,
//     },
//   });
// }

/**
 *
 * @param message
 */
async function watchElementSearchResult(message) {

  let {vid} = message;

  const eleSearchResult = document.querySelector('#search-result');
  const obSearchResult = new MutationObserver(
    async (mutations, observerSearchResult) => {

      let first = mutations[0];
      let eleTarget = first.target;
      // choose video format, first option 1080p60 or 1080p, second option
      // other's
      const eleFormatQuality = eleTarget.querySelector('#formatSelect');
      if (eleFormatQuality) {
        const qualityMap = {}; // 1080p60 720p60 720p 360p 144p
        let arrOption = eleFormatQuality.querySelectorAll(
          'optgroup[label=mp4] > option');

        arrOption.forEach(optItem => {
          let quality = optItem.value;

          let regSize = /(?<=\()(.+)(?=\))/;
          let textContent = optItem.textContent;
          let size = textContent.match(regSize)[0];

          qualityMap[quality] = {
            'size': size, // 'option': optItem,
          };
        });

        let op0 = '1080p60', op1 = '1080p';
        let op2 = '720p60', op3 = '720p';
        let op4 = '360p', op5 = '144p';
        // const qualityArr = [op0, op1];
        // const qualityArr = [op0, op1, op2, op3];
        const qualityArr = [op0, op1, op2, op3, op4, op5];

        let filter = qualityArr.filter(
          value => qualityMap.hasOwnProperty(value));
        if (filter.length === 0) {
        } else {
        }

        // request a video download link
        let quality = filter[0];
        let size = qualityMap[quality].size;
        eleFormatQuality.value = quality;
        let elementBtnaction = eleTarget.querySelector('#btn-action');
        if (elementBtnaction) {
          elementBtnaction.click();
          elementBtnaction.remove();
          // await sendMessageToNotice({
          //   text: `searching... download link`,
          // });
        }

        // get video author
        let author = eleTarget.querySelector('.clearfix > p').innerHTML.trim();
        // get video title
        let titleOrigin = eleTarget.querySelector('#video_fn').value.trim();
        let title = titleOrigin.replace(/X2Download.app-/i, '')
          .replace(/snapsave.io-/i, '');

        if (vid) {
          let message = {
            'vid': vid,
            'video': {
              vid, author, title, quality, size,
            },
          };
          await fetchVideoPost(message);
        }

      }

      // observe the element [a#asuccess] --> #asuccess
      const eleDownloadLink = eleTarget.querySelector('#asuccess');
      const obDownloadLink = new MutationObserver(
        async (mutations, observer) => {

          let item = mutations[0]; // 取出第一个 突变记录
          let href = item.target['href'];

          let {vid, playlist} = message
          if (vid) {
            let message = {
              'vid': vid,
              'video': {
                vid, downlink: href,
              },
              playlist,
            };
            await fetchVideoPut(message);
          }
        });
      if (eleDownloadLink) {
        obDownloadLink.observe(eleDownloadLink,
          {attributes: true, attributeFilter: ['href']});
      }

      // <div class="error"><p>An error has occurred. Please try
      // again!</p></div>
      let element = eleTarget.querySelector(
        '#search-result > div[class=error]');
      if (element) {
        // todo check other's element !!!
        let timeout = 20000;
        setTimeout(async () => {
          if (eleTarget.querySelector('#search-result > div[class=error]')) {
            let {vid, playlist} = message
            if (vid) {
              let message = {
                'vid': vid,
                playlist,
                tryagain: true,
              };
              await fetchNoticeMP4(message);
            }
          }
        }, timeout);
      }

    });
  if (eleSearchResult) {
    obSearchResult.observe(eleSearchResult, {childList: true});
  } else {
    // no service!!!
  }

}

async function startFn(message) {
  let {vid} = message;

  //*********************************************************************
  const eleSearchForm = document.querySelector('#search-form');
  let elementInput = eleSearchForm.querySelector('#s_input');
  elementInput.value = '';
  let prefixWatch = 'https://www.youtube.com/watch?v=';
  elementInput.value = `${prefixWatch}${vid}`;
  //*********************************************************************

  let timeout = 3600;
  setTimeout(async () => {
    let elementBtn = eleSearchForm.querySelector('.btn-red');
    elementBtn.click();
  }, timeout);

  // ************
  await watchElementSearchResult(message);

}

//********************************************************************************

/**
 * runtime onMessage
 */
browser.runtime.onMessage.addListener(async (message) => {
  await startFn(message);
});