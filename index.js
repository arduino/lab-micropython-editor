const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const openAboutWindow = require('about-window').default

let win = null // main window

// HELPERS
async function openFolderDialog() {
  // https://stackoverflow.com/questions/46027287/electron-open-folder-dialog
  let dir = await dialog.showOpenDialog(win, { properties: [ 'openDirectory' ] })
  return dir.filePaths[0] || null
}

function listFolder(folder) {
  files = fs.readdirSync(path.resolve(folder))
  // Filter out directories
  files = files.filter(f => {
    let filePath = path.resolve(folder, f)
    return !fs.lstatSync(filePath).isDirectory()
  })
  return files
}

function ilistFolder(folder) {
  let files = fs.readdirSync(path.resolve(folder))
  files = files.filter(f => {
    let filePath = path.resolve(folder, f)
    return !fs.lstatSync(filePath).isSymbolicLink()
  })
  files = files.map(f => {
    let filePath = path.resolve(folder, f)
    return {
      path: f,
      type: fs.lstatSync(filePath).isDirectory() ? 'folder' : 'file'
    }
  })
  // Filter out dot files
  files = files.filter(f => f.path.indexOf('.') !== 0)
  return files
}

function getAllFiles(dirPath, arrayOfFiles) {
  // https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
  files = ilistFolder(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach(function(file) {
    const p = path.join(dirPath, file.path)
    const stat = fs.statSync(p)
    arrayOfFiles.push({
      path: p,
      type: stat.isDirectory() ? 'folder' : 'file'
    })
    if (stat.isDirectory()) {
      arrayOfFiles = getAllFiles(p, arrayOfFiles)
    }
  })
  return arrayOfFiles
}

// LOCAL FILE SYSTEM ACCESS
ipcMain.handle('open-folder', async (event) => {
  console.log('ipcMain', 'open-folder')
  const folder = await openFolderDialog()
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
  fs.writeFileSync(filePath, content, 'utf8')
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

// START APP
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 720,
    height: 640,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    }
  })
  // and load the index.html of the app.
  win.loadFile('ui/arduino/index.html')
  // win.loadFile('ui/sandbox/index.html')
}

// TODO: Loading splash screen

const isMac = process.platform === 'darwin'
const isDev = !app.isPackaged
const template = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about'},
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      ...(isDev ? [
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ]:[
      ])
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/arduino/lab-micropython-editor')
        }
      },
      {
        label: 'Report an issue',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/arduino/lab-micropython-editor/issues')
        }
      },
      {
        label:'Info about this app',
        click: () => {
            openAboutWindow({
                icon_path: path.join(__dirname, 'ui/arduino/assets/about_image.png'),
                css_path: path.join(__dirname, 'ui/arduino/about.css'),
                copyright: '© Arduino SA 2022',
                package_json_dir: __dirname,
                bug_report_url: "https://github.com/arduino/lab-micropython-editor/issues",
                bug_link_text: "report an issue",
                homepage: "https://labs.arduino.cc",
                use_version_info: false,
                win_options: {
                    parent: win,
                    modal: true,
                },
                show_close_button: 'Close',
            })
          }
      },
    ]
  }
]

const menu = Menu.buildFromTemplate(template)

app.setAboutPanelOptions({
  applicationName: app.name,
  applicationVersion: app.getVersion(),
  copyright: app.copyright,
  credits: '(See "Info about this app" in the Help menu)',
  authors: ['Arduino'],
  website: 'https://arduino.cc',
  iconPath: path.join(__dirname, '../assets/image.png'),
})

Menu.setApplicationMenu(menu)


app.whenReady().then(createWindow)
