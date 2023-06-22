console.log('preload')
const { contextBridge, ipcRenderer } = require('electron')

const Micropython = require('micropython.js')
const board = new Micropython()
board.chunk_size = 192
board.chunk_sleep = 200

const Serial = {
  loadPorts: async () => {
    let ports = await board.list_ports()
    return ports.filter(p => p.vendorId && p.productId)
  },
  connect: async (path) => {
    return await board.open(path)
  },
  disconnect: async () => {
    return await board.close()
  },
  run: async (code) => {
    return board.run(code)
  },
  stop: async () => {
    await board.stop()
    await board.exit_raw_repl()
    return Promise.resolve()
  },
  reset: async () => {
    await board.stop()
    await board.exit_raw_repl()
    await board.reset()
    return Promise.resolve()
  },
  eval: (d) => {
    return board.eval(d)
  },
  onData: (fn) => {
    board.serial.on('data', fn)
  },
  listFiles: async (folder) => {
    return board.fs_ls(folder)
  },
  ilistFiles: async (folder) => {
    return board.fs_ils(folder)
  },
  loadFile: async (file) => {
    const output = await board.fs_cat(file)
    return output || ''
  },
  removeFile: async (file) => {
    return board.fs_rm(file)
  },
  saveFileContent: async (filename, content, dataConsumer) => {
    return board.fs_save(content || ' ', filename, dataConsumer)
  },
  uploadFile: async (diskFolder, serialFolder, filename, dataConsumer) => {
    let src = `${diskFolder}/${filename}`
    let dest = `${serialFolder}/${filename}`
    return board.fs_put(src, dest, dataConsumer)
  },
  downloadFile: async (serialFolder, diskFolder, filename) => {
    let contents = await Serial.loadFile(`${serialFolder}/${filename}`)
    return ipcRenderer.invoke('save-file', diskFolder, filename, contents)
  },
  renameFile: async (oldName, newName) => {
    return board.fs_rename(oldName, newName)
  },
  onDisconnect: async (fn) => {
    board.serial.on('close', fn)
  },
  createFolder: async (folder) => {
    return await board.fs_mkdir(folder)
  },
  exit_raw_repl: async () => {
    return board.exit_raw_repl()
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
