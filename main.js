const { app, BrowserWindow, ipcMain, nativeImage, Menu, Tray } = require('electron');
const path = require('node:path');
const { spawn } = require('child_process');
const { Transform } = require('stream');
const {contextMenu} = require('./contextMenu')
const Store = require('electron-store');
const store = new Store();
const geoip = require('geoip-lite');
const { desktopCapturer } = require('electron');

let mainWindow = null;
let globeWindow = null;
let isShowingGlobe = store.get('isShowingGlobe', true); 
app.disableHardwareAcceleration();

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    x: 0,
    y: 1000,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    width: 400,
    height: 120,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.loadFile('index.html');
}

const createGlobeWindow = () => {
  globeWindow = new BrowserWindow({
    x: 0,
    y: 0,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    width: 700,
    height: 800,
    //alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  globeWindow.loadFile('globe.html');
}

let accumulator = '';

const dataProcessor = new Transform({
  transform(chunk, encoding, callback) {
    let text = chunk.toString();
    accumulator += text;
    while (accumulator.includes(',state,bytes_in,bytes_out,')) {
      const sessionEndIndex = accumulator.indexOf(',state,bytes_in,bytes_out,') + ',state,bytes_in,bytes_out,'.length;
      const sessionText = accumulator.substring(0, sessionEndIndex);
      accumulator = accumulator.substring(sessionEndIndex);
      processSession(sessionText.replace(',state,bytes_in,bytes_out,', ''));
    }

    callback();
  },
});

function getAddressWithoutPortUniversal(host) {
  try {
    const regex = /[:.](?:\d+)$/;
    return host.replace(regex, '');
  } catch (error) {
    console.error('Error parsing address:', error);
    return '';
  }
}


let lastSessionData = {};
let geoConnections = [];
let mostActiveProcess = { name: '', remoteHost: '', maxDiff: 0, incoming: 0, outgoing: 0 };

const processSession = (sessionText) => {
  const lines = sessionText.split('\n');

  let currentProcessData = {};
  let currentProcess = '';

  lines.forEach(line => {
    if (!line.startsWith('tcp') && !line.startsWith('udp')) {
      currentProcess = line.split(',')[0];
      currentProcessData[currentProcess] = { totalIncoming: 0, totalOutgoing: 0, connections: [] };
    } else {
      const parts = line.split(',');
      const protocol = parts[0];
      const remoteHost = parts[0].split('<->')[1];
      const bytesIn = parseInt(parts[2]);
      const bytesOut = parseInt(parts[3]);

      currentProcessData[currentProcess].totalIncoming += bytesIn;
      currentProcessData[currentProcess].totalOutgoing += bytesOut;
      currentProcessData[currentProcess].connections.push({ protocol, remoteHost, bytesIn, bytesOut });
    }
  });

  let maProcess = { name: '', remoteHost: '', maxDiff: 0, incoming: 0, outgoing: 0 };
  Object.keys(currentProcessData).forEach(process => {
    if (!lastSessionData[process]) return;
  
    const lastTotalIn = lastSessionData[process].totalIncoming;
    const lastTotalOut = lastSessionData[process].totalOutgoing;
  
    const currentTotalIn = currentProcessData[process].totalIncoming;
    const currentTotalOut = currentProcessData[process].totalOutgoing;
  
    const diffIn = currentTotalIn - lastTotalIn;
    const diffOut = currentTotalOut - lastTotalOut;
    const maxDiff = Math.max(diffIn, diffOut);
  
    if (maxDiff > maProcess.maxDiff) {
      const mostActiveConnection = currentProcessData[process].connections.reduce((max, conn) => 
        (conn.bytesIn + conn.bytesOut) > (max.bytesIn + max.bytesOut) ? conn : max, { bytesIn: 0, bytesOut: 0, remoteHost: 'Unknown' });
      
      maProcess = {
        name: process,
        remoteHost: mostActiveConnection.remoteHost, 
        maxDiff: maxDiff,
        incoming: currentTotalIn,
        outgoing: currentTotalOut
      };
    }

    let cordinates = [];
    currentProcessData[process].connections.forEach(c => {
      try{
        const ip = getAddressWithoutPortUniversal(c.remoteHost);
        const geo = geoip.lookup(ip);
        let location = '';
        if(geo){
          location = `${geo.city}${geo.city && geo.region ? ', ' + geo.region : geo.region}${(geo.region || geo.city) && geo.country  ? ', ' + geo.country : geo.country}`;
          cordinates.push({endLat: geo.ll[0], endLng: geo.ll[1], location});
        }
      }catch{}
    });
    geoConnections = [...cordinates];
  });

  const isDifferent = Object.keys(maProcess).some(key => {
    return maProcess[key] !== mostActiveProcess[key];
  });

  if(maProcess.maxDiff > 0 && isDifferent){
    mostActiveProcess = {...maProcess};
    console.log('mostActiveProcess', JSON.stringify(mostActiveProcess));
    try{
      const ip = getAddressWithoutPortUniversal(mostActiveProcess.remoteHost);
      console.log('ip', ip);
      const geo = geoip.lookup(ip);
      let cc = '';
      let location = '';
      let longLat = [0, 0];
      if(geo){
        longLat = geo.ll;
        cc = geo.country.toLowerCase();
        location = `${geo.city}${geo.city && geo.region ? ', ' + geo.region : geo.region}${(geo.region || geo.city) && geo.country  ? ', ' + geo.country : geo.country}`
      }
      mainWindow?.webContents.send('mostActiveProcess', {...mostActiveProcess, cc, location});
      globeWindow?.webContents.send('geoConnections', {geoConnections, longLat});
    }catch(e){
      console.log(e);
    }
  }

  lastSessionData = {...currentProcessData};
};

function spawnNettop() {
  const nettop = spawn('nettop', ['-L', '0', '-nc', '-J', 'state,bytes_in,bytes_out']);
  nettop.stdout.pipe(dataProcessor);
  nettop.stderr.on('data', data => console.error(`stderr: ${data.toString()}`));
  nettop.on('close', code => console.log(`child process exited with code ${code}`));
}

app.whenReady().then(async () => {
  createMainWindow();
  spawnNettop();
  const dockIcon = await nativeImage.createFromPath(path.join(app.isPackaged ? process.resourcesPath + '/app' : app.getAppPath(), 'internet.png'))
  app.dock?.setIcon(dockIcon);
  if (!store.get('isShowingDockIcon', false)) {
    app.dock?.hide();
  }
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  const trayIcon = await nativeImage.createThumbnailFromPath(path.join(app.isPackaged ? process.resourcesPath + '/app' : app.getAppPath(), 'internet.png'), { width: 24, height: 24 });
  Menu.setApplicationMenu(new Menu());
  const tray = new Tray(trayIcon);
  tray.setContextMenu(contextMenu(isShowingGlobe));

  setInterval(async () => {
    isShowingGlobe = store.get('isShowingGlobe', true);
    console.log('isShowingGlobe', isShowingGlobe);
    if(!isShowingGlobe){
      try{
        if(globeWindow){
          globeWindow.close();
          globeWindow.destroy();
          globeWindow = null;
        }
      }finally{
        return;
      }
    }
    const sources = await desktopCapturer.getSources({ types: ['window'] });
    isDesktopFocused = sources?.[0]?.name === 'WindowManager' || sources?.[0]?.name === 'Network Buddy - Globe';
    const globeWindowVisible = sources?.some(s => s.name === 'Network Buddy - Globe');
    console.log(JSON.stringify(sources.map(s => s.name)), globeWindowVisible);
    try{
      if(isDesktopFocused && !globeWindowVisible){
        createGlobeWindow();
      } else if (!isDesktopFocused && globeWindowVisible){
        globeWindow.close();
        globeWindow.destroy();
        globeWindow = null;
      }
    }catch{

    }
  }, 1000);
});

app.on('window-all-closed', () => {
  app.quit();
});