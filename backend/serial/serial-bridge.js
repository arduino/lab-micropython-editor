const { ipcRenderer } = require('electron')
const path = require('path')

const SerialBridge = {
  loadPorts: async () => {
    return await ipcRenderer.invoke('serial', 'loadPorts')
  },
  connect: async (path) => {
    return await ipcRenderer.invoke('serial', 'connect', path)
  },
  disconnect: async () => {
    return await ipcRenderer.invoke('serial', 'disconnect')
  },
  run: async (code) => {
    return await ipcRenderer.invoke('serial', 'run', code)
  },
  execFile: async (path) => {
    return await ipcRenderer.invoke('serial', 'execFile', path)
  },
  getPrompt: async () => {
    return await ipcRenderer.invoke('serial', 'getPrompt')
  },
  keyboardInterrupt: async () => {
    await ipcRenderer.invoke('serial', 'keyboardInterrupt')
    return Promise.resolve()
  },
  reset: async () => {
    await ipcRenderer.invoke('serial', 'reset')
    return Promise.resolve()
  },
  eval: (d) => {
    return ipcRenderer.invoke('serial', 'eval', d)
  },
  onData: (callback) => {
    // Remove all previous listeners
    if (ipcRenderer.listeners("serial-on-data").length > 0) {
      ipcRenderer.removeAllListeners("serial-on-data")
    }
    ipcRenderer.on('serial-on-data', (event, data) => {
      callback(data)
    })
  },
  listFiles: async (folder) => {
    return await ipcRenderer.invoke('serial', 'listFiles', folder)
  },
  ilistFiles: async (folder) => {
    return await ipcRenderer.invoke('serial', 'ilistFiles', folder)
  },
  loadFile: async (file) => {
    return await ipcRenderer.invoke('serial', 'loadFile', file)
  },
  removeFile: async (file) => {
    return await ipcRenderer.invoke('serial', 'removeFile', file)
  },
  saveFileContent: async (filename, content, dataConsumer) => {
    if (ipcRenderer.listeners("serial-on-file-save-progress").length > 0) {
      ipcRenderer.removeAllListeners("serial-on-file-save-progress")
    }
    ipcRenderer.on('serial-on-file-save-progress', (event, progress) => {
      dataConsumer(progress)
    })
    return await ipcRenderer.invoke('serial', 'saveFileContent', filename, content)
  },
  uploadFile: async (src, dest, dataConsumer) => {
    if (ipcRenderer.listeners("serial-on-upload-progress").length > 0) {
      ipcRenderer.removeAllListeners("serial-on-upload-progress")
    }

    ipcRenderer.on('serial-on-upload-progress', (event, progress) => {
      dataConsumer(progress)
    })
    return await ipcRenderer.invoke('serial', 'uploadFile', src, dest)
  },
  downloadFile: async (src, dest) => {
    let contents = await ipcRenderer.invoke('serial', 'loadFile', src)
    return ipcRenderer.invoke('save-file', dest, contents)
  },
  renameFile: async (oldName, newName) => {
    return await ipcRenderer.invoke('serial', 'renameFile', oldName, newName)
  },
  onConnectionClosed: async (callback) => {
    // Remove all previous listeners  
    if (ipcRenderer.listeners("serial-on-connection-closed").length > 0) {
      ipcRenderer.removeAllListeners("serial-on-connection-closed")
    }
    ipcRenderer.on('serial-on-connection-closed', (event) => {
      callback()
    })
  },
  createFolder: async (folder) => {
    return await ipcRenderer.invoke('serial', 'createFolder', folder)
  },
  removeFolder: async (folder) => {
    return await ipcRenderer.invoke('serial', 'removeFolder', folder)
  },
  getNavigationPath: (navigation, target) => {
    return path.posix.join(navigation, target)
  },
  getFullPath: (root, navigation, file) => {
    return path.posix.join(root, navigation, file)
  },
  getParentPath: (navigation) => {
    return path.posix.dirname(navigation)
  },
  fileExists: async (filePath) => {
    return await ipcRenderer.invoke('serial', 'fileExists', filePath)
  }
}

module.exports = SerialBridge