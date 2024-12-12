const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs')
const shortcuts = require('./backend/shortcuts.js').global

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

  win.webContents.on('before-reload', async (event) => {
    // Prevent the default reload behavior
    event.preventDefault()
    
    try {
      // Tell renderer to do cleanup
      win.webContents.send('cleanup-before-reload')
      
      // Wait for cleanup then reload
      setTimeout(() => {
        // This will trigger a page reload, but won't trigger 'before-reload' again
        win.reload()
      }, 500)
    } catch(e) {
      console.error('Reload preparation failed:', e)
    }
  })

  const initialMenuState = {
    isConnected: false,
    view: 'editor'
  }

  registerIPCHandlers(win, ipcMain, app, dialog)
  registerMenu(win, initialMenuState)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

function shortcutAction(key) {
  win.webContents.send('shortcut-cmd', key);
}

// Shortcuts
function registerShortcuts() {
  Object.entries(shortcuts).forEach(([command, shortcut]) => {
    globalShortcut.register(shortcut, () => {
      shortcutAction(shortcut)
    });
  })
  // shortcuts.forEach(element => {
  //   globalShortcut.register(element, () => {
      
  //     shortcutAction(element)
  //   });
  // });
  // globalShortcut.register(shortcuts.RUN, () => {
  //   console.log('Running Program')
  //   shortcutAction(shortcuts.RUN)
  // })
  // globalShortcut.register('CommandOrControl+Alt+R', () => {
  //   console.log('Running Code Selection')
  //   shortcutAction('meta_alt_r')
  // })
  // globalShortcut.register('CommandOrControl+H', () => {
  //   console.log('Stopping Program (Halt)')
  //   shortcutAction('meta_h')
  // })
  // globalShortcut.register('CommandOrControl+S', () => {
  //   console.log('Saving File')
  //   shortcutAction('meta_s')
  // })
  
  // globalShortcut.register('CommandOrControl+Shift+R', () => {
  //   console.log('Resetting Board')
  //   shortcutAction('meta_shift_r')
  // })
  // globalShortcut.register(shortcuts.CONNECT, () => {
  //   console.log('Connect to Board')
  //   shortcutAction(shortcuts.CONNECT)
  // })
  // globalShortcut.register(shortcuts.DISCONNECT, () => {
  //   console.log('Disconnect from Board')
  //   shortcutAction(shortcuts.DISCONNECT)
  // }),
  // globalShortcut.register('CommandOrControl+K', () => {
  //   console.log('Clear Terminal')
  //   shortcutAction('K')
  // }),
  // // Future: Toggle REPL Panel
  // // globalShortcut.register('CommandOrControl+T', () => {
  // //   console.log('Toggle Terminal')
  // //   shortcutAction('T')
  // // }),
  // globalShortcut.register('Escape', () => {
  //   shortcutAction('ESC')
  // })
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