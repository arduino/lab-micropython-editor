console.log('preload')
const { contextBridge, ipcRenderer } = require('electron')

const Micropython = require('./micropython.js')
const board = new Micropython()

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
    await board.stop()
    await board.enter_raw_repl()
    let result = await board.exec_raw({ command: code })
    await board.exit_raw_repl()
    return Promise.resolve(result)
  },
  stop: () => {
    return board.stop()
  },
  reset: () => {
    return board.reset()
  },
  onData: (fn) => {
    board.serial.on('data', fn)
  }
}

const Disk = {

}

contextBridge.exposeInMainWorld('BridgeSerial', Serial)
contextBridge.exposeInMainWorld('BridgeDisk', Disk)
