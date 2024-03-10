const { app, Menu } = require('electron');
const Store = require('electron-store');
const store = new Store();
let isEnabledAtStartUp = store.get('isEnabledAtStartUp', false);
let isShowingDockIcon = store.get('isShowingDockIcon', false); 
const AutoLaunch = require('auto-launch');
const path = require('node:path');

const autoLauncher = new AutoLaunch({
  name: 'Network Buddy',
  path: path.dirname(path.dirname(path.dirname(app.getPath('exe'))))
});

const toggleAutoLaunch = async () => {
  if (isEnabledAtStartUp) {
    try {
      await autoLauncher.disable();
      const isEnabled = await autoLauncher.isEnabled();
      if (!isEnabled) {
        isEnabledAtStartUp = false;
        store.set('isEnabledAtStartUp', isEnabledAtStartUp);
      }
    } catch (e) { }
  } else {
    try {
      await autoLauncher.enable();
      const isEnabled = await autoLauncher.isEnabled();
      if (isEnabled) {
        isEnabledAtStartUp = true;
        store.set('isEnabledAtStartUp', isEnabledAtStartUp);
      }
    } catch (e) { }
  }
};

const contextMenu = (isShowingGlobe) => {
  return Menu.buildFromTemplate([
    {
      label: 'Run at startup',
      type: 'checkbox',
      checked: isEnabledAtStartUp,
      click: () => { toggleAutoLaunch(); }
    },
    {
      label: 'Show in dock',
      type: 'checkbox',
      checked: isShowingDockIcon,
      click: () => {
        try {
          if (isShowingDockIcon) {
            isShowingDockIcon = false;
            store.set('isShowingDockIcon', isShowingDockIcon);
            app.dock?.hide();
          } else {
            isShowingDockIcon = true;
            store.set('isShowingDockIcon', isShowingDockIcon);
            app.dock?.show();
            app.relaunch();
            app.exit(0);
          }
        } catch (e) { console.log(e); }
      }
    },
    {
      label: 'Show Globe in Desktop',
      type: 'checkbox',
      checked: isShowingGlobe,
      click: () => {
        try {
          if (isShowingGlobe) {
            isShowingGlobe = false;
            store.set('isShowingGlobe', isShowingGlobe);
          } else {
            isShowingGlobe = true;
            store.set('isShowingGlobe', isShowingGlobe);
          }
        } catch (e) { console.log(e); }
      }
    },
    {
      type: 'separator'
    },
    {
        label: 'Quit',
        click: () => {
          app.quit();
        }
    }
  ]);
};

module.exports = { contextMenu };