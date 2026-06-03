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
  getPrompt: async (captureInterrupt = false) => {
    return await ipcRenderer.invoke('serial', 'getPrompt', captureInterrupt)
  },
  calibrateDelay: async () => {
    return await ipcRenderer.invoke('serial', 'calibrateDelay')
  },
  keyboardInterrupt: async () => {
    await ipcRenderer.invoke('serial', 'keyboardInterrupt')
    return Promise.resolve()
  },
  prepareReset: async () => {
    await ipcRenderer.invoke('serial', 'prepareReset')
  },
  doReset: async () => {
    await ipcRenderer.invoke('serial', 'doReset')
  },
  reset: async () => {
    await ipcRenderer.invoke('serial', 'reset')
    return Promise.resolve()
  },
  eval: (d) => {
    return ipcRenderer.invoke('serial', 'eval', d)
  },
  onBeforeReset: (callback) => {
    if (ipcRenderer.listeners("serial-on-before-reset").length > 0) {
      ipcRenderer.removeAllListeners("serial-on-before-reset")
    }
    ipcRenderer.once('serial-on-before-reset', () => {
      callback()
    })
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
  loadFile: async (file, dataConsumer) => {
    if (dataConsumer) {
      ipcRenderer.removeAllListeners("serial-on-load-progress")
      ipcRenderer.on('serial-on-load-progress', (event, progress) => {
        console.log('[serial-bridge] serial-on-load-progress received:', progress)
        dataConsumer(progress)
      })
    }
    const result = await ipcRenderer.invoke('serial', 'loadFile', file)
    console.log('[serial-bridge] invoke resolved, removing listener')
    ipcRenderer.removeAllListeners("serial-on-load-progress")
    return result
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
  saveFileContentAtomic: async (filename, content, dataConsumer) => {
    if (ipcRenderer.listeners("serial-on-file-save-progress").length > 0) {
      ipcRenderer.removeAllListeners("serial-on-file-save-progress")
    }
    ipcRenderer.on('serial-on-file-save-progress', (event, progress) => {
      dataConsumer(progress)
    })
    return await ipcRenderer.invoke('serial', 'saveFileContentAtomic', filename, content)
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
  downloadFile: async (src, dest, dataConsumer) => {
    if (dataConsumer) {
      ipcRenderer.removeAllListeners("serial-on-load-progress")
      ipcRenderer.on('serial-on-load-progress', (event, progress) => {
        console.log('[serial-bridge] serial-on-load-progress (download) received:', progress)
        dataConsumer(progress)
      })
    }
    let contents = await ipcRenderer.invoke('serial', 'loadFile', src)
    console.log('[serial-bridge] download invoke resolved, removing listener')
    ipcRenderer.removeAllListeners("serial-on-load-progress")
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
    return path.posix.join(root, navigation.replaceAll(path.win32.sep, path.posix.sep), file.replaceAll(path.win32.sep, path.posix.sep))
  },
  getParentPath: (navigation) => {
    return path.posix.dirname(navigation)
  },
  fileExists: async (filePath) => {
    return await ipcRenderer.invoke('serial', 'fileExists', filePath)
  }
}

module.exports = SerialBridge