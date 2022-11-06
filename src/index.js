const {mainHome} = require("./main/home");

const {app, BrowserWindow, Menu} = require('electron');
const path = require('path');

let win = null;
function createWindow(filePath = "./dist/index.html") {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // nodeIntergration: false,
      preload: path.join(__dirname, './preload.js')
    }
  });

  // win.loadFile(filePath);
  win.loadURL(filePath);
}

app.whenReady().then(() => {
  mainHome.init();
  // 打开多个窗口
  // createWindow("http://localhost:3000/");
  const path = (__dirname + '').replace('src', 'dist/index.html')
  createWindow(path);
  // Menu.setApplicationMenu(null)
})