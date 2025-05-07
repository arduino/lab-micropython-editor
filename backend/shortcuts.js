const { globalShortcut } = require('electron')
let shortcutsActive = false
const shortcuts = {
  global: {
    CLOSE: 'CommandOrControl+W',
    CONNECT: 'CommandOrControl+Shift+C',
    DISCONNECT: 'CommandOrControl+Shift+D',
    RUN: 'CommandOrControl+R',
    RUN_SELECTION: 'CommandOrControl+Alt+R',
    RUN_SELECTION_WL: 'CommandOrControl+Alt+S',
    STOP: 'CommandOrControl+H',
    RESET: 'CommandOrControl+Shift+R',
    NEW: 'CommandOrControl+N',
    SAVE: 'CommandOrControl+S',
    CLEAR_TERMINAL: 'CommandOrControl+L',
    EDITOR_VIEW: 'CommandOrControl+Alt+1',
    FILES_VIEW: 'CommandOrControl+Alt+2',
  },
  menu: {
    CLOSE: 'CmdOrCtrl+W',
    CONNECT: 'CmdOrCtrl+Shift+C',
    DISCONNECT: 'CmdOrCtrl+Shift+D',
    RUN: 'CmdOrCtrl+R',
    RUN_SELECTION: 'CmdOrCtrl+Alt+R',
    RUN_SELECTION_WL: 'CmdOrCtrl+Alt+S',
    STOP: 'CmdOrCtrl+H',
    RESET: 'CmdOrCtrl+Shift+R',
    NEW: 'CmdOrCtrl+N',
    SAVE: 'CmdOrCtrl+S',
    CLEAR_TERMINAL: 'CmdOrCtrl+L',
    EDITOR_VIEW: 'CmdOrCtrl+Alt+1',
    FILES_VIEW: 'CmdOrCtrl+Alt+2'
  },
  // Shortcuts
}

function disableShortcuts (win, value) {
  console.log(value ? 'disabling' : 'enabling', 'shortcuts')
  win.send('ignore-shortcuts', value)
}

module.exports = {
  shortcuts,
  disableShortcuts
}

