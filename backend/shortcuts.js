const { globalShortcut } = require('electron')
let shortcutsActive = false
const shortcuts = {
  global: {
    CONNECT: 'CommandOrControl+Shift+C',
    DISCONNECT: 'CommandOrControl+Shift+D',
    SAVE: 'CommandOrControl+S',
    RUN: 'CommandOrControl+R',
    RUN_SELECTION: 'CommandOrControl+Alt+R',
    RUN_SELECTION_WL: 'CommandOrControl+Alt+S',
    STOP: 'CommandOrControl+H',
    RESET: 'CommandOrControl+Shift+R',
    CLEAR_TERMINAL: 'CommandOrControl+L',
    EDITOR_VIEW: 'CommandOrControl+Alt+1',
    FILES_VIEW: 'CommandOrControl+Alt+2',
    ESC: 'Escape'
  },
  menu: {
    CONNECT: 'CmdOrCtrl+Shift+C',
    DISCONNECT: 'CmdOrCtrl+Shift+D',
    SAVE: 'CmdOrCtrl+S',
    RUN: 'CmdOrCtrl+R',
    RUN_SELECTION: 'CmdOrCtrl+Alt+R',
    RUN_SELECTION_WL: 'CmdOrCtrl+Alt+S',
    STOP: 'CmdOrCtrl+H',
    RESET: 'CmdOrCtrl+Shift+R',
    CLEAR_TERMINAL: 'CmdOrCtrl+L',
    EDITOR_VIEW: 'CmdOrCtrl+Alt+1',
    FILES_VIEW: 'CmdOrCtrl+Alt+2'
  },
  // Shortcuts
}

function shortcutAction(key, win) {
  console.log("key:", key)
  win.send('shortcut-cmd', key);
}

function registerShortcuts (win) {
  console.log("registering shortcuts")
  win.send('ignore-shortcuts', false)
}
function unregisterShortcuts(win) {
  console.log("unregistering shortcuts")
  // globalShortcut.unregisterAll()
  win.send('ignore-shortcuts', true)
}

function disableShortcuts (win, value) {
  console.log("registering shortcuts")
  win.send('ignore-shortcuts', value)
}

module.exports = {
  shortcuts,
  disableShortcuts
}

