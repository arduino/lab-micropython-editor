console.log('preload')
const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')

const Micropython = require('micropython-ctl-cont').MicroPythonDevice
const board = new Micropython()

const Serial = {
  loadPorts: async () => {
    // let ports = await board.list_ports()
    // return ports.filter(p => p.vendorId && p.productId)
    return ipcRenderer.invoke('serial-list-ports')
  },
  connect: async (path) => {
    return ipcRenderer.invoke('serial-connect', path)
  },
  disconnect: async () => {
    return ipcRenderer.invoke('serial-disconnect')
  },
  run: async (code) => {
    return ipcRenderer.invoke('serial-run', code)
  },
  stop: async () => {
    return ipcRenderer.invoke('serial-stop')
  },
  reset: async () => {
    await ipcRenderer.invoke('serial-reset')
  },
  eval: (d) => {
    return ipcRenderer.invoke('serial-eval', d)
  },
  onData: (fn) => {
    ipcRenderer.on('terminal-data', (_e, data) => fn(data))
  },
  onDisconnect: async (fn) => {
    ipcRenderer.on('disconnect', (_e) => fn())
  },
  listFiles: async (folder) => {
    return ipcRenderer.invoke('serial-list-files', folder)
  },
  ilistFiles: async (folder) => {
    return ipcRenderer.invoke('serial-ilist-files', folder)
  },
  loadFile: async (file) => {
    return ipcRenderer.invoke('serial-load-file', file)
  },
  removeFile: async (file) => {
    return ipcRenderer.invoke('serial-remove-file', file)
  },
  saveFileContent: async (filename, content) => {
    return ipcRenderer.invoke('serial-save-file', filename, content)
  },
  uploadFile: async (src, dest) => {
    return ipcRenderer.invoke('serial-upload', src, dest)
  },
  downloadFile: async (src, dest) => {
    return ipcRenderer.invoke('serial-download', src, dest)
  },
  renameFile: async (oldName, newName) => {
    return ipcRenderer.invoke('serial-rename-file', oldName, newName)
  },
  createFolder: async (folder) => {
    return ipcRenderer.invoke('serial-create-folder', folder)
  },
  getNavigationPath: (navigation, target) => {
    return path.posix.join(navigation, target)
  },
  getFullPath: (root, navigation, file) => {
    return path.posix.join(root, navigation, file)
  },
  getParentPath: (navigation) => {
    return path.posix.dirname(navigation)
  }
}

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
  getNavigationPath: (navigation, target) => {
    return path.join(navigation, target)
  },
  getFullPath: (root, navigation, file) => {
    return path.resolve(path.join(root, navigation, file))
  },
  getParentPath: (navigation) => {
    return path.dirname(navigation)
  }
}

const Window = {
  setWindowSize: (minWidth, minHeight) => {
    ipcRenderer.invoke('set-window-size', minWidth, minHeight)
  }
}

contextBridge.exposeInMainWorld('BridgeSerial', Serial)
contextBridge.exposeInMainWorld('BridgeDisk', Disk)
contextBridge.exposeInMainWorld('BridgeWindow', Window)
