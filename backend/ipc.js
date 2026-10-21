const fs = require('fs')
const registerMenu = require('./menu.js')
const serial = require('./serial/serial.js').sharedInstance
const { MicroPythonError } = require('micropython.js')
const { shell } = require('electron');

const {
  openFolderDialog,
  listFolder,
  ilistFolder,
  getAllFiles
} = require('./helpers.js')

module.exports = function registerIPCHandlers(win, ipcMain, app, dialog) {
  serial.win = win // Required to send callback messages to renderer

  const _fileWatchers = new Map() // filePath → { watcher, suppressUntil, debounceTimer }

  ipcMain.handle('watch-file', (event, filePath) => {
    if (_fileWatchers.has(filePath)) return
    const entry = { watcher: null, suppressUntil: 0, debounceTimer: null }
    entry.watcher = fs.watch(filePath, () => {
      if (Date.now() < entry.suppressUntil) return
      clearTimeout(entry.debounceTimer)
      entry.debounceTimer = setTimeout(() => {
        win.webContents.send('file-changed', filePath)
      }, 200)
    })
    entry.watcher.on('error', () => { /* ignore — file may be deleted */ })
    _fileWatchers.set(filePath, entry)
  })

  ipcMain.handle('unwatch-file', (event, filePath) => {
    const entry = _fileWatchers.get(filePath)
    if (!entry) return
    clearTimeout(entry.debounceTimer)
    entry.watcher.close()
    _fileWatchers.delete(filePath)
  })

  ipcMain.handle('suppress-file-watch', (event, filePath) => {
    const entry = _fileWatchers.get(filePath)
    if (entry) entry.suppressUntil = Date.now() + 1000
  })
  
  ipcMain.handle('open-folder', async (event) => {
    const folder = await openFolderDialog(win)
    let files = []
    if (folder) {
      files = listFolder(folder)
    }
    return { folder, files }
  })

  ipcMain.handle('list-files', async (event, folder) => {
    if (!folder) return []
    return listFolder(folder)
  })

  ipcMain.handle('ilist-files', async (event, folder) => {
    if (!folder) return []
    return ilistFolder(folder)
  })

  ipcMain.handle('ilist-all-files', (event, folder) => {
    if (!folder) return []
    return getAllFiles(folder)
  })

  ipcMain.handle('load-file', (event, filePath) => {
    let content = fs.readFileSync(filePath)
    return content
  })

  ipcMain.handle('save-file', (event, filePath, content) => {
    const data = Buffer.from(content);
    fs.writeFileSync(filePath, data)
    return true
  })

  ipcMain.handle('remove-file', (event, filePath) => {
    fs.unlinkSync(filePath)
    return true
  })

  ipcMain.handle('rename-file', (event, filePath, newFilePath) => {
    fs.renameSync(filePath, newFilePath)
    return true
  })

  ipcMain.handle('create-folder', (event, folderPath) => {
    try {
      fs.mkdirSync(folderPath, { recursive: true })
    } catch(e) {
      console.log('error', e)
      return false
    }
    return true
  })

  ipcMain.handle('remove-folder', (event, folderPath) => {
    fs.rmdirSync(folderPath, { recursive: true, force: true })
    return true
  })

  ipcMain.handle('file-exists', (event, filePath) => {
    try {
      fs.accessSync(filePath, fs.constants.F_OK)
      return true
    } catch(err) {
      return false
    }
  })
  // WINDOW MANAGEMENT

  ipcMain.handle('set-window-size', (event, minWidth, minHeight) => {
    if (!win) return false
    win.setMinimumSize(minWidth, minHeight)
  })

  ipcMain.handle('confirm-close', () => {
    app.exit()
  })

  ipcMain.handle('is-packaged', () => {
    return app.isPackaged
  })

  ipcMain.handle('get-app-path', () => {
    return app.getAppPath()
  })

  ipcMain.handle('open-dialog', (event, opt) => {
    const response = dialog.showMessageBoxSync(win, opt)
    return response != opt.cancelId
  })

  ipcMain.handle('update-menu-state', (event, state) => {
    registerMenu(win, state)
  })

  ipcMain.handle('launch-app', async (event, urlScheme) => {
    // Launch an external app with a custom protocol
    return new Promise((resolve, reject) => {
      if(app.getApplicationNameForProtocol(urlScheme) === '') {        
        resolve(false); // App not installed
        return;
      }

      try {
        shell.openExternal(urlScheme).then(() => {
          resolve(true);  // App opened successfully
        }).catch(() => {
          resolve(false);  // App not installed
        });
      } catch (err) {
        reject(err);
      }
    });
  });
  
  ipcMain.handle('open-url', async (event, url) => {
    shell.openExternal(url);
  });

  win.on('close', (event) => {
    event.preventDefault()
    win.webContents.send('check-before-close')
  })

  ipcMain.handle('serial', async (event, command, ...args) => {
    // console.debug('Handling IPC serial command:', command, ...args)
    try {
      return await serial[command](...args)
    } catch (e) {
      // Expected cancellations from micropython.js — operation interrupted by stop(),
      // a subsequent run(), or a reset(). Resolve with null so Electron doesn't log
      // these as IPC errors.
      if (e instanceof MicroPythonError && (
        e.code === MicroPythonError.INTERRUPTED_BY_STOP  ||
        e.code === MicroPythonError.INTERRUPTED_BY_RERUN ||
        e.code === MicroPythonError.INTERRUPTED_BY_RESET
      )) return null
      throw e
    }
  })
}
