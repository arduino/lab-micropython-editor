const { app, Menu } = require('electron')
const { shortcuts, disableShortcuts } = require('./shortcuts.js')
const path = require('path')
const serial = require('./serial/serial.js').sharedInstance
const openAboutWindow = require('about-window').default

const { type } = require('os')

let appInfoWindow = null

function closeAppInfo(win) {
  disableShortcuts(win, false)
  appInfoWindow.off('close', () => closeAppInfo(win))
  appInfoWindow = null
  
}
function openAppInfo(win) {
  if (appInfoWindow != null) {
    appInfoWindow.show()
  } else {
    appInfoWindow = openAboutWindow({
      icon_path: path.resolve(__dirname, '../ui/arduino/media/about_image.png'),
      css_path: path.resolve(__dirname, '../ui/arduino/views/about.css'),
      copyright: '© Arduino SA 2022',
      package_json_dir: path.resolve(__dirname, '..'),
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
    appInfoWindow.on('close', () => closeAppInfo(win));
    disableShortcuts(win, true)
  }
}

module.exports = function registerMenu(win, state = {}) {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { type: 'separator' },
        { role: 'hide', accelerator: 'CmdOrCtrl+Shift+H' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New', 
          accelerator: shortcuts.menu.NEW,
          enabled: state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.NEW)
        },
        { label: 'Save', 
          accelerator: shortcuts.menu.SAVE,
          enabled: state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.SAVE)
        },
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
      label: 'Board',
      submenu: [
        { 
          label: 'Connect',
          accelerator: shortcuts.menu.CONNECT,
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.CONNECT)
        },
        { 
          label: 'Disconnect',
          accelerator: shortcuts.menu.DISCONNECT,
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.DISCONNECT)
        },
        { type: 'separator' },
        { 
          label: 'Run',
          accelerator: shortcuts.menu.RUN,
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.RUN)
        },
        { 
          label: 'Run selection',
          accelerator: isMac ? shortcuts.menu.RUN_SELECTION : shortcuts.menu.RUN_SELECTION_WL,
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', (isMac ? shortcuts.global.RUN_SELECTION : shortcuts.global.RUN_SELECTION_WL))
        },
        { 
          label: 'Stop',
          accelerator: shortcuts.menu.STOP,
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.STOP)
        },
        { 
          label: 'Reset',
          accelerator: shortcuts.menu.RESET,
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.RESET)
        },
        { type: 'separator' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { 
          label: 'Editor',
          accelerator: shortcuts.menu.EDITOR_VIEW,
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.EDITOR_VIEW,)
        },
        { 
          label: 'Files',
          accelerator: shortcuts.menu.FILES_VIEW,
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.FILES_VIEW)
        },
        { 
          label: 'Clear terminal',
          accelerator: shortcuts.menu.CLEAR_TERMINAL,
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', shortcuts.global.CLEAR_TERMINAL)
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ]
    },
    {
      label: 'Window',
      submenu: [
        { 
          label: 'Reload',
          accelerator: '',
          click: async () => {
            try {
              await serial.disconnect()
              win.reload()
            } catch(e) {
              console.error('Reload from menu failed:', e)
            }
          }
        },
        { role: 'toggleDevTools'},
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          
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
          label:'About Arduino Lab for MicroPython',
          click: () => { openAppInfo(win) }
        },
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu)

}
