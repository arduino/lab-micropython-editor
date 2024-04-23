const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const registerIPCHandlers = require('./backend/ipc.js')
const registerMenu = require('./backend/menu.js')

let win = null // main window
let splash = null
let splashTimeout = null

// START APP
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 720,
    height: 640,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      show: false
    }
  })
  // and load the index.html of the app.
  win.loadFile('ui/arduino/index.html')
  // If the app takes a while to open, show splash screen
  splashTimeout = setTimeout(() => {
    // Create the splash screen
    splash = new BrowserWindow({
      width: 560,
      height: 180,
      transparent: true,
      frame: false,
      alwaysOnTop: true
    });
    splash.loadFile('ui/arduino/splash.html')
  }, 250)

  win.once('ready-to-show', () => {
    clearTimeout(splashTimeout)
    if (splash) splash.destroy()
    win.show()
  })

  registerIPCHandlers(win, ipcMain, app)
  registerMenu(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

app.on('ready', createWindow)
