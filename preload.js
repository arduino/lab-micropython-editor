console.log('preload')
const { contextBridge, ipcRenderer } = require('electron')

const Micropython = require('micropython.js')
const board = new Micropython()

const Serial = {
  loadPorts: async () => {
    let ports = await board.listPorts()
    return ports.filter(p => p.vendorId && p.productId)
  },
  connect: async (path) => {
    return await board.open(path)
  },
  disconnect: async () => {
    return await board.close()
  },
  run: async (code) => {
    if (board.in_raw_repl) {
      await board.exit_raw_repl()
    }
    await board.enter_raw_repl()
    let result = await board.exec_raw({ command: code })
    await board.exit_raw_repl()
    return Promise.resolve(result)
  },
  stop: async () => {
    if (board.in_raw_repl) {
      await board.stop()
      return board.exit_raw_repl()
    } else {
      return board.stop()
    }
  },
  reset: async () => {
    if (board.in_raw_repl) {
      await board.stop()
      await board.exit_raw_repl()
      return board.reset()
    } else {
      return board.reset()
    }
  },
  eval: (d) => {
    return board.eval(d)
  },
  onData: (fn) => {
    board.serial.on('data', fn)
  },
  listFiles: async () => {
    const output = await board.fs_ls()
    return output
  },
  loadFile: async (file) => {
    const output = await board.fs_cat(file)
    return output || ''
  },
  removeFile: async (file) => {
    return board.fs_rm(file)
  },
  saveFileContent: async (filename, content) => {
    return board.fs_save(content || ' ', filename)
  },
  uploadFile: async (folder, filename) => {
    let src = `${folder}/${filename}`
    let dest = filename
    return board.fs_put(src, dest)
  },
  downloadFile: async (folder, filename) => {
    let contents = await Serial.loadFile(filename)
    return ipcRenderer.invoke('save-file', folder, filename, contents)
  },
  renameFile: async (oldName, newName) => {
    return board.fs_rename(oldName, newName)
  },
  onDisconnect: async (fn) => {
    board.serial.on('close', fn)
  }
}

const Disk = {
  openFolder: async () => {
    return ipcRenderer.invoke('open-folder')
  },
  listFiles: async (folder) => {
    return ipcRenderer.invoke('list-files', folder)
  },
  loadFile: async (folder, file) => {
    let content = await ipcRenderer.invoke('load-file', folder, file)
    return new TextDecoder().decode(content)
  },
  removeFile: async (folder, file) => {
    return ipcRenderer.invoke('remove-file', folder, file)
  },
  saveFileContent: async (folder, file, content) => {
    return ipcRenderer.invoke('save-file', folder, file, content)
  },
  renameFile: async (folder, oldName, newName) => {
    return ipcRenderer.invoke('rename-file', folder, oldName, newName)
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
