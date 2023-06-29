const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const Micropython = require('micropython-ctl-cont').MicroPythonDevice
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

// MICROPYTHON
const board = new Micropython()
ipcMain.handle('serial-list-ports', (event) => {
  console.log('ipcMain', 'serial-list-ports')
  return [
    { path: '/dev/ttyACM0' },
    { path: '/dev/ttyACM1' },
    { path: '/dev/ttyUSB0' },
    { path: '/dev/ttyUSB1' },
  ]
})
ipcMain.handle('serial-connect', async (event, path) => {
  console.log('ipcMain', 'serial-connect', path)
  await board.disconnect()
  await board.connectSerial(path)
  board.sendData(Buffer.from('\x03\x03'))
  board.onTerminalData = (d) => {
    win.webContents.send('terminal-data', d)
  }
  board.onclose = () => {
    win.webContents.send('disconnect')
  }
})
ipcMain.handle('serial-disconnect', async (event) => {
  console.log('ipcMain', 'serial-disconnect')
  await board.disconnect()
})
ipcMain.handle('serial-run', async (event, code) => {
  console.log('ipcMain', 'serial-run', code)
  win.webContents.send('terminal-data', '\r\n')
  try {
    const output = await board.runScript(code , {
      disableDedent: true,
      broadcastOutputAsTerminalData: true
    })
  } catch(err) {
    console.log(err)
  }
  board.sendData('\r\n')
  return Promise.resolve(output)
})
ipcMain.handle('serial-stop', async (event) => {
  console.log('ipcMain', 'serial-stop')
  board.sendData(Buffer.from('\r\x03\x03'))
  try {
    await board.readUntil('>>>', 5)
  } catch {
    // Might be stuck in raw repl. Try to exit into friendly repl with Ctrl+B
    try {
      await board.sendData('\r\x03\x02\r')
    } catch {
      console.log('could not stop')
    }
  }
})
ipcMain.handle('serial-reset', async (event) => {
  console.log('ipcMain', 'serial-reset')
  await board.reset()
})
ipcMain.handle('serial-eval', async (event, data) => {
  // console.log('ipcMain', 'serial-eval', data)
  board.sendData(Buffer.from(data))
})
ipcMain.handle('serial-list-files', async (event, folder) => {
  console.log('ipcMain', 'serial-list-files', folder)
  return await board.listFiles(folder)
})
ipcMain.handle('serial-ilist-files', async (event, folder) => {
  console.log('ipcMain', 'serial-ilist-files', folder)
  let files = await board.listFiles(folder)
  files = files.map(f => ({
    path: f.filename.slice(1),
    type: f.isDir ? 'folder' : 'file'
  }))
  // console.log('yolo', files)
  return files
})
ipcMain.handle('serial-load-file', async (event, filePath) => {
  console.log('ipcMain', 'serial-load-file', filePath)
  const output = await board.getFile(filePath)
  return output.toString()
})
ipcMain.handle('serial-remove-file', async (event, filePath) => {
  console.log('ipcMain', 'serial-remove-file', filePath)
  await board.remove(filePath)
})
ipcMain.handle('serial-save-file', async (event, filePath, content) => {
  console.log('ipcMain', 'serial-save-file', filePath, content)
  await board.putFile(filePath, Buffer.from(content))
})
ipcMain.handle('serial-upload', async (event, src, dest) => {
  console.log('ipcMain', 'serial-upload-file', src, dest)
  const content = fs.readFileSync(src)
  await board.putFile(dest, content)
})
ipcMain.handle('serial-download', async (event, src, dest) => {
  console.log('ipcMain', 'serial-download-file', src, dest)
  const content = await board.getFile(src)
  fs.writeFileSync(dest, content)
})
ipcMain.handle('serial-rename-file', async (event, src, dest) => {
  console.log('ipcMain', 'serial-rename-file', src, dest)
  await board.rename(src, dest)
})
ipcMain.handle('serial-create-folder', async (event, folder) => {
  console.log('ipcMain', 'serial-create-folder', folder)
  try {
    await board.mkdir(folder)
  } catch(err) {
    console.log('error', err)
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
