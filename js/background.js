'use strict';

const prehost = `http://localhost:16206/`;
let socketGlobal = new WebSocket('ws://localhost:16206');
socketGlobal.addEventListener('open', async () => {
  setInterval(async () => {
    let message = {
      'action': 'heart_firefox',
    };
    socketGlobal?.send(JSON.stringify(message));
  }, 16);
});
socketGlobal.addEventListener('close', () => {
  clearInterval();
});
socketGlobal.addEventListener('error', () => {
  clearInterval();
});
socketGlobal.addEventListener('message', async (messageEvent) => {
  let message = JSON.parse(messageEvent.data);

  let action = message['action'];
  switch (action) {
    case'notice_browser_gogetmp4':
      await downloadVideo(message);
      break;
    case'notice_browser_gogetjpg':
      await tabNewOneSendData(message);
      break;
    case'notice_browser_gogetplaylist':
      await tabNewOneSendData(message);
      break;
    case 'nb_notice':
      await sendMessageToNotice(message);
      break;
  }
});

function fetchMovejpg(message) {
  let {vid} = message;
  if (vid) {
    let message = {vid};
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

/**
 *
 * @param message
 * @returns {Promise<Boolean>}
 */
async function fetchVideoCheck(message) {
  let {vid} = message;
  let input = `${prehost}video/check/${vid}`;
  let response = await fetch(input);
  return response.json();
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
 *
 * @param message{Object:{title:String, text:String}}
 * @returns {Promise<void>}
 */
async function sendMessageToNotice(message) {
  let {title, text} = message;
  let titleDefault = 'youtube playlist download queue';
  if (message.hasOwnProperty('title') === false) {
    title = titleDefault;
  } else if (title) {
  } else {
    title = titleDefault;
  }

  let notificationId = 'cake-notification';
  await browser.notifications.create(notificationId, {
    type: 'basic',
    title: title,
    message: text,
  });

  let timeout = 3;

  setTimeout(async () => {
    await browser.notifications.clear(notificationId);
  }, timeout * 1000);

}

/**
 * download video before --> check url
 * @param message
 */
async function downloadVideo(message) {
  // let messageNotice = {title: 'open new tab', text: 'go to searching'};
  // await sendMessageToNotice(messageNotice);

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
  if (videourl === null) {
    return null;
  } else if (videourl.includes(prefixWatch)) {
    return getVidBySearch(videourl, prefixWatch, endSplit);
  } else if (videourl.includes(prefixShort)) {
    return getVidBySearch(videourl, prefixShort, endSplit);
  } else {
    return null;
  }
}

async function cmDownloadVideoCheck(message) {
  let {vid} = message;
  let exists = await fetchVideoCheck(message);
  if (exists) {
    let messageExists = {
      title: 'dont need download',
      text: 'video data exists\nmp4 file also exists',
    };
    await sendMessageToNotice(messageExists);
  } else {
    let messageExistsNot = {
      title: 'searching',
      text: `video ${vid}`,
    };
    await sendMessageToNotice(messageExistsNot);
    await downloadVideo(message);
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
  // await sendMessageToNotice({text: 'prepare add new queue', close: {timeout: 3}});
  fetchQueuePost(message);
});

browser.runtime.onMessage.addListener(async (message) => {

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
      contexts: ['link', 'video', 'page', 'selection'],
    },
    () => {
      initContextMenuVisibleValue(cmDownloadVideoId, true);
    });
let cmDownloadThumbnailId = browser.contextMenus.create({
      id: 'cmDownloadthumbnail', title: 'Download Thumbnail',
      contexts: ['image', 'link'],
    },
    () => {
      initContextMenuVisibleValue(cmDownloadThumbnailId, false);
    });

//************************************************************************
browser.contextMenus.onClicked.addListener(async (info) => {
  // is it a youtube link?
  let vid = getVid(info.linkUrl || null)
      || getVid(info.pageUrl || null)
      || getVid(info.selectionText || null);

  if (vid) {
    let message = {
      vid,
    };
    switch (info.menuItemId) {
      case cmDownloadVideoId:
        await cmDownloadVideoCheck(message);
        break;
      case cmDownloadThumbnailId:
        await cmDownloadthumbnail(message);
        break;
    }
  } else {
    // not a youtube link, do nothing
    let messageExists = {
      title: 'cannot download',
      text: 'cannot find video id',
    };
    await sendMessageToNotice(messageExists);
  }
});
