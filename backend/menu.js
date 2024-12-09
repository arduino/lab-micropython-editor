const { app, Menu } = require('electron')
const path = require('path')
const openAboutWindow = require('about-window').default

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
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => win.webContents.send('shortcut-cmd', 'C')
        },
        { 
          label: 'Disconnect',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => win.webContents.send('shortcut-cmd', 'D')
        },
        { role: 'separator' },
        { 
          label: 'Run',
          accelerator: 'CmdOrCtrl+R',
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', 'r')
        },
        { 
          label: 'Stop',
          accelerator: 'CmdOrCtrl+H',
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', 'h')
        },
        { 
          label: 'Reset',
          accelerator: 'CmdOrCtrl+Shift+R',
          enabled: state.isConnected && state.view === 'editor',
          click: () => win.webContents.send('shortcut-cmd', 'R')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', accelerator: '' },
        { role: 'toggleDevTools', accelerator: ''},
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
                  // about_page_dir: path.resolve(__dirname, '../ui/arduino/views/'),
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
