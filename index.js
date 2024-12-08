const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron')
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

function shortcutAction(key) {
  win.webContents.send('shortcut-cmd', key);
}

// Shortcuts
function registerShortcuts() {
  globalShortcut.register('CommandOrControl+R', () => {
    console.log('Running Program')
    shortcutAction('r')
  })
  globalShortcut.register('CommandOrControl+H', () => {
    console.log('Stopping Program (Halt)')
    shortcutAction('h')
  })
  globalShortcut.register('CommandOrControl+S', () => {
    console.log('Saving File')
    shortcutAction('s')
  })
  
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    console.log('Resetting Board')
    shortcutAction('R')
  })
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    console.log('Connect to Board')
    shortcutAction('C')
  })
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    console.log('Disconnect from Board')
    shortcutAction('D')
  })
}

app.on('ready', () => {
  createWindow()
  registerShortcuts()

  win.on('focus', () => {
    registerShortcuts()
  })
  win.on('blur', () => {
    globalShortcut.unregisterAll()
  })
  
})