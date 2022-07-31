console.log('preload')
const { contextBridge, ipcRenderer } = require('electron')

const Micropython = require('./micropython.js')
const board = new Micropython()

const Serial = {
	listPorts: () => {
		return board.listPorts()
	},
	close: () => {
		return board.close()
	},
	connect: (port) => {
		board.device = port
		return board.open()
	},
	write: (k) => {
		return board.eval(k)
	},
	run: async (code) => {
		await board.enter_raw_repl()
		const result = await board.exec_raw(code)
		await board.exit_raw_repl()
		return Promise.resolve(result)
	},
	stop: () => {
		return board.stop()
	},
	reset: () => {
		return board.reset()
	}
}

const Disk = {
	openFolder: async () => {
		console.log('diskBus', 'open-folder')
		return await ipcRenderer.invoke('open-folder')
	},
	loadFile: async (folder, filename) => {
		console.log('diskBus', 'load-file', folder, filename)
		return await ipcRenderer.invoke('load-file', folder, filename)
	},
	saveFile: async ({ folder, filename, content }) => {
		console.log('diskBus', 'save-file', folder, filename, content)
		return await ipcRenderer.invoke('save-file', folder, filename, content)
	},
	updateFolder: async (folder) => {
		console.log('diskBus', 'update-folder', folder)
		return await ipcRenderer.invoke('update-folder', folder)
	},
	removeFile: async ({ folder, filename }) => {
		console.log('diskBus', 'remove-file', folder, filename)
		return await ipcRenderer.invoke('remove-file', folder, filename)
	},
	renameFile: async ({ folder, filename, newFilename }) => {
		// TODO: Sanitize `newFilename`
		console.log('diskBus', 'rename-file', folder, filename, newFilename)
		if (folder && filename) {
			return await ipcRenderer.invoke('rename-file', folder, filename, newFilename)
		} else {
			return Promise.resolve()
		}
	}
}

contextBridge.exposeInMainWorld('MicropythonSerial', Serial)
contextBridge.exposeInMainWorld('Disk', Disk)
