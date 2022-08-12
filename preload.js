console.log('preload')
const { contextBridge, ipcRenderer } = require('electron')

const Micropython = require('./micropython.js')
const board = new Micropython()

function extractFileArray(output) {
  output = output.replace(/'/g, '"');
  output = output.split('OK')
  let files = output[2] || ''
  files = files.slice(0, files.indexOf(']')+1)
  files = JSON.parse(files)
  return files
}

const Serial = {
  loadPorts: async () => {
    let ports = await board.listPorts()
    return ports.filter(p => p.manufacturer)
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
    let output = await board.fs_ls()
    return extractFileArray(output)
  },
  loadFile: async (file) => {
    let output = await board.fs_cat(file)
    output = output.split('OK')
    return output[2] || ''
  },
  removeFile: async (file) => {
    return board.fs_rm(file)
  },
  saveFileContent: async (content, filename) => {
    content = content.replace(//g, ``)
    return board.fs_save(content, filename)
  }
}

const Disk = {

}

contextBridge.exposeInMainWorld('BridgeSerial', Serial)
contextBridge.exposeInMainWorld('BridgeDisk', Disk)
