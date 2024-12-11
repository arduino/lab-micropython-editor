const { app, Menu } = require('electron')
const path = require('path')
const Serial = require('./serial.js')
const openAboutWindow = require('about-window').default
const shortcuts  = require('./shortcuts.js')
const { type } = require('os')

module.exports = function registerMenu(win, state = {}) {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about'},
        { type: 'separator' },
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
              await Serial.disconnect()
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
          label:'Info about this app',
          click: () => {
              openAboutWindow({
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

}
