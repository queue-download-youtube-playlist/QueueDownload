//******************************************

function getElement() {
  return document.getElementById('noticeDivQueueDownload');
}

function hideNotice(timeout = 3) {
  let elementById = getElement();
  if (elementById) {
    setTimeout(async () => {
      elementById.style.visibility = 'hidden';
    },timeout * 1000)
  }
}

function showNotice() {
  let elementById = getElement();
  if (elementById) {
    elementById.style.visibility = 'unset';
  }
}

function existsNotice() {
  let elementById = getElement();
  if (elementById) {
    return true
  }else {
    return false
  }
}


function updateContent(message) {
  if (!existsNotice()) {
    addNoticeDiv()
  }

  let elementById = document.getElementById('noticeSpanQueueDownload');
  if (elementById) {
    showNotice()
    let {text} = message
    elementById.textContent = String(text);
  }

  if (message.close) {
    hideNotice(message.close.timeout)
  }

}

function addNoticeDiv() {
  let bodyElement = document.querySelector('body');
  let widthDiv = 240;
  let centerPosition = 50 - parseFloat(String(widthDiv)) /
      bodyElement.clientWidth * 100;

  let nodeDiv = document.createElement('div');
  nodeDiv.id = 'noticeDivQueueDownload';
  nodeDiv.style.cssText =
      `
    background-color: red;
    color: white;
    
    position: fixed;
    width: ${widthDiv * 2}px;
    height: 40px;
    top: 0;
    left: ${centerPosition}%;
    z-index: 10000;
    text-align: center;
    vertical-align: middle;
    display: inline-grid;
    align-items: center;
    border-radius: 3px;
    
    font-size: 1rem;
    
`;
  nodeDiv.style.visibility = 'hidden';

  // nodeSpan
  let nodeSpan = document.createElement('span');
  nodeSpan.id = 'noticeSpanQueueDownload';
  // nodeSpan.textContent = 'hello world';

  nodeDiv.appendChild(nodeSpan);
  bodyElement.appendChild(nodeDiv);
}

//************************************************

browser.runtime.onMessage.addListener((message) => {
  if (message.type.includes('noticejs')) {
    updateContent(message)
  }
})
















