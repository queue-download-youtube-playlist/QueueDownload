'use strict';

//*********************************************************************
function setupTheDOMBodyAndData(elecontainer) {
  const contextMenuArr = [
    {
      id: 'cmDownloadVideo',
    },
    {
      id: 'cmDownloadthumbnail',
    },
    // {id: 'cmAddToQueue', title: 'Add to queue',},
  ];

  contextMenuArr.forEach(obj => {
    let {id: key} = obj;

    let element = elecontainer.querySelector(`#${key}`);
    element.addEventListener('change', async (ev) => {
      const val = ev.target.checked;
      let objNew = {};
      objNew[key] = val;
      await browser.storage.local.set(objNew);
      await browser.contextMenus.update(key, {visible: val});
    });

    browser.storage.local.get(key).then(value => {
      const qualifiedNameChecked = 'checked';
      let length = Object.keys(value).length;
      if (length === 1) {
        let val = value[key];
        if (val) {
          element.checked = qualifiedNameChecked;
        } else {
          element.removeAttribute(qualifiedNameChecked);
        }
      }
    });

  });
}


function startFn() {
  let elecontainer = document.querySelector('#container');
  elecontainer.setAttribute('class',
      `container-fluid bg-dark text-white h-100`);

  setupTheDOMBodyAndData(elecontainer);
}

startFn();










