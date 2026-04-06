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

    async prepareReset() {
        await this.board.stop()
        // exit_raw_repl() may timeout if the board is in an unexpected state.
        // Don't let that block doReset() — the reset should still proceed.
        try {
            await this.board.exit_raw_repl()
        } catch (e) {
            console.warn('prepareReset: exit_raw_repl failed, proceeding anyway:', e.message)
        }
    }

    async doReset() {
        // soft_reset may throw if enter_raw_repl times out (board in unexpected state).
        // Fire the before-reset IPC event regardless so the router transitions to reset
        // mode and the 4-second fallback in the editor can clean up correctly.
        let fired = false
        try {
            await this.board.soft_reset(() => {
                fired = true
                this.win.webContents.send('serial-on-before-reset')
            })
            // After machine.soft_reset() via raw REPL the board comes back in raw REPL
            // mode. Exit raw REPL with passThrough=true so the banner bytes (including
            // \r\n>>> ) are forwarded to _dataCallback and reach the reset handler,
            // which strips noise and auto-transitions to repl-interactive.
            await this.board.exit_raw_repl(true)
        } catch (e) {
            console.warn('doReset: failed:', e.message)
            if (!fired) {
                this.win.webContents.send('serial-on-before-reset')
            }
        }
    }

    async reset() {
        await this.prepareReset()
        await this.doReset()
    }

    async eval(d) {
        return await this.board.eval(d)
    }

    registerCallbacks() {
        // Route data through micropython.js rather than tapping the raw port directly.
        // micropython.js forwards bytes here only when appropriate:
        //   - interactive REPL bytes (no read_until active)
        //   - user code output (exec_raw with passThrough=true)
        //   - get_prompt step 1 bytes (passThrough=true, so stop tracebacks reach the handler)
        // Internal protocol bytes (enter/exit raw REPL, _checkRam, fs_* etc.) are never
        // forwarded — they are consumed silently inside micropython.js read_until calls.
        this.board.setDataCallback((data) => {
            this.win.webContents.send('serial-on-data', data)
        })

        // micropython.js registers its own 'error' handler in open() that cancels
        // pending reads. This handler adds console logging for observability.
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
        // micropython.js cancels in-flight reads via _cancelPendingReads on port close/error,
        // so fs_save rejects cleanly on disconnect — no external race needed.
        try {
            await this.board.fs_save(content || ' ', tmp, (progress) => {
                this.win.webContents.send('serial-on-file-save-progress', progress)
            })
            await this.board.fs_rename(tmp, filename)
        } catch (e) {
            // Best-effort cleanup — fs_rm may fail if the board is disconnected; ignore.
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