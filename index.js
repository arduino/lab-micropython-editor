const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

let win = null // main window

async function openFolderDialog() {
  // https://stackoverflow.com/questions/46027287/electron-open-folder-dialog
  let dir = await dialog.showOpenDialog(win, { properties: [ 'openDirectory' ] })
  return dir.filePaths[0] || null
}

ipcMain.handle('open-folder', async (event) => {
  console.log('ipcMain', 'open-folder')
  const folder = await openFolderDialog()
  let files = []
  if (folder) {
    files = fs.readdirSync(path.resolve(folder))
    // Filter out directories
    files = files.filter(f => {
      let filePath = path.resolve(folder, f)
      return !fs.lstatSync(filePath).isDirectory()
    })
  }
  return { folder, files }
})

ipcMain.handle('load-file', (event, folder, filename) => {
  console.log('ipcMain', 'load-file', folder, filename )
  let filePath = path.resolve(folder, filename)
  let content = fs.readFileSync(filePath)
  return content
})

ipcMain.handle('save-file', (event, folder, filename, content) => {
  console.log('ipcMain', 'save-file', folder, filename, content)
  let filePath = path.resolve(folder, filename)
  fs.writeFileSync(filePath, content, 'utf8')
  return true
})

ipcMain.handle('update-folder', (event, folder) => {
  let files = fs.readdirSync(path.resolve(folder))
  // Filter out directories
  files = files.filter(f => {
    let filePath = path.resolve(folder, f)
    return !fs.lstatSync(filePath).isDirectory()
  })
  return { folder, files }
})

ipcMain.handle('remove-file', (event, folder, filename) => {
  console.log('ipcMain', 'remove-file', folder, filename)
  let filePath = path.resolve(folder, filename)
  fs.unlinkSync(filePath)
  return true
})

ipcMain.handle('rename-file', (event, folder, filename, newFilename) => {
  console.log('ipcMain', 'rename-file', folder, filename, newFilename)
  let filePath = path.resolve(folder, filename)
  let newFilePath = path.resolve(folder, newFilename)
  fs.renameSync(filePath, newFilePath)
  return newFilename
})

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 700,
    height: 640,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    }
  })
  // and load the index.html of the app.
  win.loadFile('ui/blank/index.html')
}

app.whenReady().then(createWindow)
