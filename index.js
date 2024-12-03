const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const registerIPCHandlers = require('./backend/ipc.js')
const registerMenu = require('./backend/menu.js')

let win = null // main window
let splash = null
let splashTimestamp = null

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
  // Create the splash screen
  splash = new BrowserWindow({
    width: 450,
    height: 140,
    transparent: true,
    frame: false,
    alwaysOnTop: true
  });
  splash.loadFile('ui/arduino/splash.html')
  splashTimestamp = Date.now()

  win.once('ready-to-show', () => {
    if (Date.now()-splashTimestamp > 1000) {
      splash.destroy()
    } else {
      setTimeout(() => {
        splash.destroy()
      }, 500)
    }
    win.show()
  })

  registerIPCHandlers(win, ipcMain, app, dialog)
  registerMenu(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

app.on('ready', createWindow)
