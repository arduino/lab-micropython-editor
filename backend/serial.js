const MicroPython = require('micropython.js')

const board = new MicroPython()
board.chunk_size = 192
board.chunk_sleep = 200

const Serial = {
  loadPorts: async () => {
    let ports = await board.list_ports()
    return ports.filter(p => p.vendorId && p.productId)
  },
  connect: async (path) => {
    return board.open(path)
  },
  disconnect: async () => {
    return board.close()
  },
  run: async (code) => {
    return board.run(code)
  },
  execFile: async (path) => {
    return board.execfile(path)
  },
  getPrompt: async () => {
    return board.get_prompt()
  },
  keyboardInterrupt: async () => {
    await board.stop()
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
    const output = await board.fs_cat_binary(file)
    return output || ''
  },
  removeFile: async (file) => {
    return board.fs_rm(file)
  },
  saveFileContent: async (filename, content, dataConsumer) => {
    return board.fs_save(content || ' ', filename, dataConsumer)
  },
  uploadFile: async (src, dest, dataConsumer) => {
    return board.fs_put(src, dest.replaceAll(path.win32.sep, path.posix.sep), dataConsumer)
  },
  downloadFile: async (src, dest) => {
    let contents = await Serial.loadFile(src)
    return ipcRenderer.invoke('save-file', dest, contents)
  },
  renameFile: async (oldName, newName) => {
    return board.fs_rename(oldName, newName)
  },
  onConnectionLost: async (fn) => {
    board.serial.on('close', fn)
  },
  createFolder: async (folder) => {
    return await board.fs_mkdir(folder)
  },
  removeFolder: async (folder) => {
    return await board.fs_rmdir(folder)
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
    // !!!: Fix this on micropython.js level
    // ???: Check if file exists is not part of mpremote specs
    const output = await board.run(`
import os
try:
  os.stat("${filePath}")
  print(0)
except OSError:
  print(1)
`)
    return output[2] === '0'
  }
}

module.exports = Serial