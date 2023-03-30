'use strict';

const prehost = `http://localhost:16206/`;
const socket = new WebSocket('ws://localhost:16206');
socket.addEventListener('open', () => {
});
socket.addEventListener('close', () => {
  clearInterval();
});
socket.addEventListener('error', () => {
  clearInterval();
});

function heartBeat(message) {
  socket.uuid = message.uuid;
  setInterval(async () => {
    let message = {
      'action': 'heart_firefox',
      'uuid': socket.uuid,
    };
    socket.send(JSON.stringify(message));
  }, 16);
}

socket.addEventListener('message',
    async (ev) => {
      let message = JSON.parse(ev.data);
      let action = message['action'];
      switch (action) {
        case'socketinit':
          heartBeat(message);
          break;
        case'notice_browser_gogetmp4':
          await downloadVideo(message);
          break;
        case'notice_browser_gogetjpg':
          await tabNewOneSendData(message);
          break;
        case'notice_browser_gogetplaylist':
          await tabNewOneSendData(message);
          break;
        case 'notice_browser_sendmessagetonotice':
          await sendMessageToNotice(message);
          break;
      }
    });

function fetchMovejpg(message) {
  let {vid, queue, uuid} = message;
  if (vid) {
    let message = {vid, queue, uuid};
    let input = `${prehost}move/jpg`;
    let init = {
      method: 'POST', headers: {
        'Content-Type': 'application/json',
      }, body: JSON.stringify(message),
    };
    fetch(input, init).then();
  }
}

function fetchQueuePost(message) {
  message.uuid = socket.uuid;
  let input = `${prehost}queue/`;
  let init = {
    method: 'post', headers: {
      'content-type': 'application/json',
    }, body: JSON.stringify(message),
  };
  fetch(input, init).then();
}

/**
 * put message to desktop electron
 * @param message
 */
function fetchVideoPut(message) {
  let {vid, video, queue} = message;
  if (vid) {
    let message = {
      vid, video, queue,
    };
    let input = `${prehost}video/`;
    let init = {
      method: 'PUT', mode: 'cors', headers: {
        'Content-Type': 'application/json',
      }, body: JSON.stringify(message),
    };
    fetch(input, init).then();
  }
}

/**
 * post message to desktop electron nodejs server
 * @param message
 */
function fetchVideoPost(message) {
  let {vid, video, queue} = message;
  if (vid) {
    let message = {
      vid, video, queue,
    };
    let input = `${prehost}video/`;
    let init = {
      method: 'POST', mode: 'cors', headers: {
        'Content-Type': 'application/json',
      }, body: JSON.stringify(message),
    };
    fetch(input, init).then();
  }
}

function fetchTaskplaylist(message) {
  let input = `${prehost}task/`;
  let init = {
    method: 'POST', mode: 'cors', headers: {
      'Content-Type': 'application/json',
    }, body: JSON.stringify(message),
  };
  fetch(input, init).then();
}

function fetchNoticeMP4(message) {
  let input = `${prehost}notice/mp4`;
  let init = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  };
  fetch(input, init).then();
}

//******************************************************************************
//******************************************************************************

function getRamdomURL() {
  let urlArr = ['https://snapsave.io/', 'https://x2download.app/'];
  let length = urlArr.length;
  let random = Math.random() * length + 1;
  let idx = parseInt(random.toString()) - 1;
  let url = urlArr[idx];
  // let url = 'https://snapsave.io/'
  return url;
}

/**
 * {text: '', close:{timeout: 3}}
 * @param message
 * @returns {Promise<void>}
 */
async function sendMessageToNotice(message) {
  let {text} = message;
  let notificationId = 'cake-notification';
  let title = 'youtube playlist download queue';
  await browser.notifications.create(notificationId, {
    type: 'basic',
    title: title,
    message: text,
  });

  let timeout = 3;
  if (message.close) {
    timeout = message.close;
  }
  setTimeout(async () => {
    await browser.notifications.clear(notificationId);
  }, timeout * 1000);

}

/**
 * download video before --> check url
 * @param message
 */
async function downloadVideo(message) {
  await sendMessageToNotice({text: 'starting...', close: {timeout: 3}});

  let {vid, queue} = message;
  if (vid) {
    let url = getRamdomURL();
    let message = {
      url,
      vid,
      queue,
      // type: `xdownload`,
    };
    await tabNewOneSendData(message);
  }
}

//******************************************************

/**
 * send tab with data, same time download jpg
 * @param message{Object:{url:String,any:any}}
 */
async function tabNewOneSendData(message) {
  let {url} = message;
  let active = false;
  if (message.hasOwnProperty('active')) {
    active = message['active'];
  }
  let tabCreate = await browser.tabs.create({url, active});
  let tabCreateId = tabCreate.id;
  let cb = async function(tabId, changeInfo, tab) {
    let searchString = 'complete';
    if (tabCreateId === tabId && tab.status.includes(searchString)) {
      message['tabId'] = tabId;
      try {
        await browser.tabs.sendMessage(tabId, message);
        browser.tabs.onUpdated.removeListener(cb);
      } catch (e) {
      }
    }
  };
  browser.tabs.onUpdated.addListener(cb);

}

//******************************************************************************

function convertTargetlinkToQueue(targetlink, searchObj) {
  let {start, type} = searchObj;
  let startIdx = targetlink.indexOf(start);
  let playlist = targetlink.substring(startIdx + start.length);
  return {targetlink, playlist, type};
}

function getVidBySearch(videourl, start, end) {
  try {
    let startIdx = videourl.indexOf(start);
    let endIdx = videourl.indexOf(end);

    return endIdx === -1 ?
        videourl.substring(startIdx + start.length) :
        videourl.substring(startIdx + start.length, endIdx);
  } catch (e) {
    return null;
  }
}

function getVid(videourl) {
  let prefixWatch = 'https://www.youtube.com/watch?v=';
  let prefixShort = 'https://youtu.be/';
  let endSplit = '&';
  // let {, start, end} = obj;
  if (videourl.includes(prefixWatch)) {
    return getVidBySearch(videourl, prefixWatch, endSplit);
  } else if (videourl.includes(prefixShort)) {
    return getVidBySearch(videourl, prefixShort, endSplit);
  } else {
    return null;
  }
}

async function cmDownloadthumbnail(message) {
  let {vid} = message;
  if (vid) {
    await tabNewOneSendData({
      vid,
      'url': `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
      // type: `image`,
    });
  }
}

//******************************************************************************

//******************************************************************************

// browserAction open option page
browser.browserAction.onClicked.addListener(async () => {
  // await sendMessageToNotice({text: 'open option page', close: {timeout: 3}});
  await browser.runtime.openOptionsPage();
});

// add this playlist to queue
browser.pageAction.onClicked.addListener(async function(tab) {
  if (socket.uuid) {
    let {url, title} = tab;
    let prefixPlaylist = 'https://www.youtube.com/playlist?list=';
    let searchObj = {
      'start': prefixPlaylist, 'type': 2,
    };
    let queue = convertTargetlinkToQueue(url, searchObj);
    queue['title'] = title;
    let message = {
      queue,
    };
    message.uuid = socket.uuid;
    // await sendMessageToNotice({text: 'prepare add new queue', close: {timeout: 3}});
    fetchQueuePost(message);
  }
});

browser.runtime.onMessage.addListener(async (message) => {
  message.uuid = socket.uuid;

  switch (message.action) {
    case 'sendMessageToNotice':
      await sendMessageToNotice(message);
      break;
    case'tabNewOneSendData':
      await tabNewOneSendData(message);
      break;
    case'fetchVideoPost':
      fetchVideoPost(message);
      break;
    case'fetchVideoPut':
      fetchVideoPut(message);
      break;
    case'fetchTaskplaylist':
      fetchTaskplaylist(message);
      break;
    case'fetchMovejpg':
      fetchMovejpg(message);
      break;
    case'fetchNoticeMP4':
      fetchNoticeMP4(message);
      break;
  }

});

//******************************************************************************

function initContextMenuVisibleValue(cmId, initVal) {
  browser.storage.local.get(cmId.toString()).then(
      async (obj) => {
        let length = Object.keys(obj).length;
        if (length === 0) {
          let objNew = {};
          objNew[cmId] = initVal;
          await browser.storage.local.set(objNew);
          await browser.contextMenus.update(cmId,
              {visible: initVal});
        } else if (length === 1) {
          let val = obj[cmId];
          let objNew = {};
          objNew[cmId] = val;
          await browser.storage.local.set(objNew);
          await browser.contextMenus.update(cmId,
              {visible: val});

        }
      });
}

let cmDownloadVideoId = browser.contextMenus.create({
  id: 'cmDownloadVideo', title: 'Download video',
  contexts: ['link', 'video', 'page'],
}, null);
initContextMenuVisibleValue(cmDownloadVideoId, true);
let cmDownloadThumbnailId = browser.contextMenus.create({
  id: 'cmDownloadthumbnail', title: 'Download Thumbnail',
  contexts: ['image', 'link'],
}, null);
initContextMenuVisibleValue(cmDownloadThumbnailId, false);
browser.contextMenus.onClicked.addListener(
    async (info, tab) => {
      if (socket.uuid) {

        let videourl = info.linkUrl || info.pageUrl;
        // is it a youtube link?
        let vid = getVid(videourl);
        if (vid) {
          let message = {
            vid,
          };
          switch (info.menuItemId) {
            case cmDownloadVideoId:
              await downloadVideo(message);
              break;
            case cmDownloadThumbnailId:
              await cmDownloadthumbnail(message);
              break;
          }
        } else {
          // not a youtube link, do nothing
        }
      }
    });
