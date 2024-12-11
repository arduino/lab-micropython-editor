const MicroPython = require('micropython.js')

class Serial {
    constructor(win) {
        this.win = win
        this.board = new MicroPython()
        this.board.chunk_size = 192
        this.board.chunk_sleep = 200
    }

    async loadPorts() {
        let ports = await this.board.list_ports()
        return ports.filter(p => p.vendorId && p.productId)
    }

    async connect(path) {
        await this.board.open(path)
        this.registerCallbacks()
    }

    async disconnect() {
        return await this.board.close()
    }

    async run(code) {
        return await this.board.run(code)
    }

    async execFile(path) {
        return await this.board.execfile(path)
    }

    async getPrompt() {
        return await this.board.get_prompt()
    }

    async keyboardInterrupt() {
        await this.board.stop()
        return Promise.resolve()
    }

    async reset() {
        await this.board.stop()
        await this.board.exit_raw_repl()
        await this.board.reset()
        return Promise.resolve()
    }

    async eval(d) {
        return await this.board.eval(d)
    }

    registerCallbacks() {
        this.board.serial.on('data', (data) => {
            this.win.webContents.send('serial-on-data', data)
        })

        this.board.serial.on('close', () => {
            this.win.webContents.send('serial-on-connection-closed')
        })
    }

    async listFiles(folder) {
        return await this.board.fs_ls(folder)
    }

    async ilistFiles(folder) {
        return await this.board.fs_ils(folder)
    }

    async loadFile(file) {
        const output = await this.board.fs_cat_binary(file)
        return output || ''
    }

    async removeFile(file) {
        return await this.board.fs_rm(file)
    }

    async saveFileContent(filename, content, dataConsumer) {
        return await this.board.fs_save(content || ' ', filename, dataConsumer)
    }

    async uploadFile(src, dest, dataConsumer) {
        return await this.board.fs_put(src, dest.replaceAll(path.win32.sep, path.posix.sep), dataConsumer)
    }

    async renameFile(oldName, newName) {
        return await this.board.fs_rename(oldName, newName)
    }

    async createFolder(folder) {
        return await this.board.fs_mkdir(folder)
    }

    async removeFolder(folder) {
        return await this.board.fs_rmdir(folder)
    }

    async fileExists(filePath) {
        const output = await this.board.run(`
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