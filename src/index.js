const {mainHome} = require("./main/home");

const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const React = require('react');
const path = require('path');

console.log('React.version', React.version);


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
  console.log('app ready');
  // 打开多个窗口
  // createWindow("http://localhost:3000/");
  const path = (__dirname + '').replace('src', 'dist/index.html')
  console.log('load file', path)
  createWindow(path);
  // Menu.setApplicationMenu(null)

})