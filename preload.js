console.log('preload')
const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
const shortcuts = require('./backend/shortcuts.js').shortcuts.global
const { platform } = require('process')
const SerialBridge = require('./backend/serial/serial-bridge.js')

const Disk = {
  openFolder: async () => {
    return ipcRenderer.invoke('open-folder')
  },
  listFiles: async (folder) => {
    return ipcRenderer.invoke('list-files', folder)
  },
  ilistFiles: async (folder) => {
    return ipcRenderer.invoke('ilist-files', folder)
  },
  ilistAllFiles: async (folder) => {
    return ipcRenderer.invoke('ilist-all-files', folder)
  },
  loadFile: async (filePath) => {
    let content = await ipcRenderer.invoke('load-file', filePath)
    return new TextDecoder().decode(content)
  },
  removeFile: async (filePath) => {
    return ipcRenderer.invoke('remove-file', filePath)
  },
  saveFileContent: async (filePath, content) => {
    return ipcRenderer.invoke('save-file', filePath, content)
  },
  renameFile: async (oldName, newName) => {
    return ipcRenderer.invoke('rename-file', oldName, newName)
  },
  createFolder: async (folderPath) => {
    return ipcRenderer.invoke('create-folder', folderPath)
  },
  removeFolder: async (folderPath) => {
    return ipcRenderer.invoke('remove-folder', folderPath)
  },
  getNavigationPath: (navigation, target) => {
    return path.join(navigation, target)
  },
  getFullPath: (root, navigation, file) => {
    return path.resolve(path.join(root, navigation, file))
  },
  getParentPath: (navigation) => {
    return path.dirname(navigation)
  },
  fileExists: async (filePath) => {
    return ipcRenderer.invoke('file-exists', filePath)
  },
  getAppPath: () => {
    return ipcRenderer.invoke('get-app-path')
  }
}

const Window = {
  setWindowSize: (minWidth, minHeight) => {
    ipcRenderer.invoke('set-window-size', minWidth, minHeight)
  },
  onKeyboardShortcut: (callback, key) => {
    ipcRenderer.on('shortcut-cmd', (event, k) => {
      callback(k);
    })
  },
  onDisableShortcuts: (callback, value) => {
    ipcRenderer.on('ignore-shortcuts', (e, value) => {
      callback(value);
    })
  },

  beforeClose: (callback) => ipcRenderer.on('check-before-close', callback),
  confirmClose: () => ipcRenderer.invoke('confirm-close'),
  isPackaged: () => ipcRenderer.invoke('is-packaged'),
  openDialog: (opt) => ipcRenderer.invoke('open-dialog', opt),

  getOS: () => platform,
  isWindows: () => platform === 'win32',
  isMac: () => platform === 'darwin',
  isLinux: () => platform === 'linux',

  updateMenuState: (state) => {
    return ipcRenderer.invoke('update-menu-state', state)
  },
  getShortcuts: () => shortcuts
}

/**
 * Launches an app using the provided URL scheme (e.g. myapp://). If the app is not installed, it will
 * fallback to open the provided fallback URL.
 * @param {string} url The URL scheme to use to launch the app
 * @param {string} fallbackUrl The URL to open if the app is not installed
 */
async function launchApp(url, fallbackUrl) {
  const success = await ipcRenderer.invoke('launch-app', url);

  if (!success) {      
    await ipcRenderer.invoke('open-url', fallbackUrl); // Fallback to open a URL in the default browser
  }
}

contextBridge.exposeInMainWorld('launchApp', launchApp)
contextBridge.exposeInMainWorld('BridgeSerial', SerialBridge)
contextBridge.exposeInMainWorld('BridgeDisk', Disk)
contextBridge.exposeInMainWorld('BridgeWindow', Window)