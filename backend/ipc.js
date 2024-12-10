const fs = require('fs')
const {
  openFolderDialog,
  listFolder,
  ilistFolder,
  getAllFiles
} = require('./helpers.js')

module.exports = function registerIPCHandlers(win, ipcMain, app, dialog) {
  ipcMain.handle('open-folder', async (event) => {
    console.log('ipcMain', 'open-folder')
    const folder = await openFolderDialog(win)
    let files = []
    if (folder) {
      files = listFolder(folder)
    }
    return { folder, files }
  })

  ipcMain.handle('list-files', async (event, folder) => {
    console.log('ipcMain', 'list-files', folder)
    if (!folder) return []
    return listFolder(folder)
  })

  ipcMain.handle('ilist-files', async (event, folder) => {
    console.log('ipcMain', 'ilist-files', folder)
    if (!folder) return []
    return ilistFolder(folder)
  })

  ipcMain.handle('ilist-all-files', (event, folder) => {
    console.log('ipcMain', 'ilist-all-files', folder)
    if (!folder) return []
    return getAllFiles(folder)
  })

  ipcMain.handle('load-file', (event, filePath) => {
    console.log('ipcMain', 'load-file', filePath)
    let content = fs.readFileSync(filePath)
    return content
  })

  ipcMain.handle('save-file', (event, filePath, content) => {
    console.log('ipcMain', 'save-file', filePath, content)
    const data = Buffer.from(content);
    fs.writeFileSync(filePath, data)
    return true
  })

  ipcMain.handle('update-folder', (event, folder) => {
    console.log('ipcMain', 'update-folder', folder)
    let files = fs.readdirSync(path.resolve(folder))
    // Filter out directories
    files = files.filter(f => {
      let filePath = path.resolve(folder, f)
      return !fs.lstatSync(filePath).isDirectory()
    })
    return { folder, files }
  })

  ipcMain.handle('remove-file', (event, filePath) => {
    console.log('ipcMain', 'remove-file', filePath)
    fs.unlinkSync(filePath)
    return true
  })

  ipcMain.handle('rename-file', (event, filePath, newFilePath) => {
    console.log('ipcMain', 'rename-file', filePath, newFilePath)
    fs.renameSync(filePath, newFilePath)
    return true
  })

  ipcMain.handle('create-folder', (event, folderPath) => {
    console.log('ipcMain', 'create-folder', folderPath)
    try {
      fs.mkdirSync(folderPath, { recursive: true })
    } catch(e) {
      console.log('error', e)
      return false
    }
    return true
  })

  ipcMain.handle('remove-folder', (event, folderPath) => {
    console.log('ipcMain', 'remove-folder', folderPath)
    fs.rmdirSync(folderPath, { recursive: true, force: true })
    return true
  })

  ipcMain.handle('file-exists', (event, filePath) => {
    console.log('ipcMain', 'file-exists', filePath)
    try {
      fs.accessSync(filePath, fs.constants.F_OK)
      return true
    } catch(err) {
      return false
    }
  })
  // WINDOW MANAGEMENT

  ipcMain.handle('set-window-size', (event, minWidth, minHeight) => {
    console.log('ipcMain', 'set-window-size', minWidth, minHeight)
    if (!win) {
      console.log('No window defined')
      return false
    }

    win.setMinimumSize(minWidth, minHeight)
  })

  ipcMain.handle('confirm-close', () => {
    console.log('ipcMain', 'confirm-close')
    app.exit()
  })

  ipcMain.handle('is-packaged', () => {
    return app.isPackaged
  })

  ipcMain.handle('get-app-path', () => {
    console.log('ipcMain', 'get-app-path')
    return app.getAppPath()
  })

  ipcMain.handle('open-dialog', (event, opt) => {
    console.log('ipcMain', 'open-dialog', opt)
    const response = dialog.showMessageBoxSync(win, opt)
    return response != opt.cancelId
  })

  ipcMain.handle('update-menu-state', (event, state) => {
    const registerMenu = require('./menu.js')
    registerMenu(win, state)
  })

  win.on('close', (event) => {
    console.log('BrowserWindow', 'close')
    event.preventDefault()
    win.webContents.send('check-before-close')
  })

  // handle disconnection before reload
  ipcMain.handle('prepare-reload', async (event) => {
    return win.webContents.send('before-reload')
  })
}
