const MicroPython = require('micropython.js')
const path = require('path')

class Serial {
    constructor(win = null) {
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

        // Prevent uncaught-exception dialogs when the OS rejects a write to a
        // disconnected device (ENXIO). The 'close' event follows and handles cleanup.
        this.board.serial.on('error', (err) => {
            console.error('Serial port error:', err.message)
        })

        this.board.serial.on('close', () => {
            this.board.serial.removeAllListeners("data")
            this.board.serial.removeAllListeners("error")
            this.board.serial.removeAllListeners("close")
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

    async saveFileContent(filename, content) {
        return await this.board.fs_save(content || ' ', filename, (progress) => {
            this.win.webContents.send('serial-on-file-save-progress', progress)
        })
    }

    async saveFileContentAtomic(filename, content) {
        const tmp = filename + '.tmp'
        // Race fs_save against the serial port close event. micropython.js waits for board
        // responses and does not handle port close internally — without this race, a mid-save
        // disconnect causes fs_save to hang indefinitely, blocking the IPC invoke reply.
        let onClose
        const closeRace = new Promise((_, reject) => {
            onClose = () => reject(new Error('Serial port closed during save'))
            this.board.serial.once('close', onClose)
        })
        try {
            await Promise.race([
                this.board.fs_save(content || ' ', tmp, (progress) => {
                    this.win.webContents.send('serial-on-file-save-progress', progress)
                }),
                closeRace
            ])
            this.board.serial.removeListener('close', onClose)
            await this.board.fs_rename(tmp, filename)
        } catch (e) {
            this.board.serial.removeListener('close', onClose)
            // Best-effort cleanup — do not await, a disconnected board will hang fs_rm
            this.board.fs_rm(tmp).catch(() => {})
            throw e
        }
    }

    async uploadFile(src, dest) {
        return await this.board.fs_put(src, dest.replaceAll(path.win32.sep, path.posix.sep), (progress) => {
            this.win.webContents.send('serial-on-upload-progress', progress)
        })
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

const sharedInstance = new Serial()

module.exports = {sharedInstance, Serial}