console.log('preload')
const { ipcRenderer } = require('electron')
const EventEmitter = require('events')
const SerialConnection = require('./micropython.js')

const serialBus = new EventEmitter()
let port = null
let connection = null
const SERIAL_BUFFER_SIZE = 128

serialBus.on('load-ports', () => {
	console.log('serialBus', 'load-ports')
	SerialConnection.listAvailable()
		.then((ports) => {
			serialBus.emit('ports', ports)
		})
		.catch((err) => {
			console.log(err)
		})
})

serialBus.on('connect', (p) => {
	console.log('serialBus', 'connect', p)
	connection = new SerialConnection()
	connection.on('connected', () => {
		console.log('serialBus', 'connected')
		serialBus.emit('connected', p)
	})
	connection.on('disconnected', () => {
		console.log('serialBus', 'disconnected')
		serialBus.emit('disconnected', p)
	})
	connection.on('output', (d) => {
		serialBus.emit('data', d)
	})
	connection.on('execution-started', () => {
		console.log('serialBus', 'execution-started')
		serialBus.emit('running')
	})
	connection.on('execution-finished', () => {
		console.log('serialBus', 'execution-finished')
		serialBus.emit('stopped')
	})
	connection.open(p)
})

serialBus.on('disconnect', () => {
	console.log('serialBus', 'disconnect')
	connection.close()
	serialBus.emit('disconnected')
})

serialBus.on('run', (code) => {
	console.log('serialBus', 'run', code)
	connection.execute(code)
	serialBus.emit('running')
})

serialBus.on('stop', () => {
	console.log('serialBus', 'stop')
	connection.stop()
	serialBus.emit('stopped')
})

serialBus.on('reset', () => {
	console.log('serialBus', 'reset')
	connection.softReset()
	serialBus.emit('stopped')
})

serialBus.on('write', (command) => {
	connection.evaluate(command)
})

serialBus.on('save-file', (filename, code) => {
	console.log('serialBus', 'save-file', filename, code)
	connection.writeFile(filename, code)
})

serialBus.on('load-file', (filename) => {
	console.log('serialBus', 'load-file', filename)
	connection.loadFile(filename)
})

serialBus.on('list-files', () => {
	console.log('serialBus', 'list-files')
	connection.listFiles()
})

serialBus.on('rename-file', (oldPath, newPath) => {
	console.log('serialBus', 'rename-file', oldPath, newPath)
	connection.renameFile(oldPath, newPath)
})

serialBus.on('remove-file', (filename) => {
	console.log('serialBus', 'remove-file', filename)
	connection.removeFile(filename)
})

window.serialBus = serialBus


const diskBus = new EventEmitter()

diskBus.on('open-folder', () => {
	console.log('diskBus', 'open-folder')
	ipcRenderer.invoke('open-folder')
		.then((result) => {
			diskBus.emit('folder-opened', result)
		})
})

diskBus.on('load-file', ({ folder, filename }) => {
	console.log('diskBus', 'load-file', folder, filename)
	ipcRenderer.invoke('load-file', folder, filename)
		.then((result) => {
			diskBus.emit('file-loaded', result)
		})
})

diskBus.on('save-file', ({ folder, filename, content }) => {
	console.log('diskBus', 'save-file', folder, filename, content)
	ipcRenderer.invoke('save-file', folder, filename, content)
		.then((result) => {
			if (result) {
				diskBus.emit('file-saved')
			} else {
				console.log('error', result)
			}
		})
})

diskBus.on('update-folder', (folder) => {
	console.log('diskBus', 'update-folder', folder)
	ipcRenderer.invoke('update-folder', folder)
		.then((results) => {
			diskBus.emit('folder-updated', results)
		})
})

diskBus.on('remove-file', ({ folder, filename }) => {
	console.log('diskBus', 'remove-file', folder, filename)
	ipcRenderer.invoke('remove-file', folder, filename)
		.then((result) => {
			diskBus.emit('file-removed')
		})
})

diskBus.on('rename-file', ({ folder, filename, newFilename }) => {
	// TODO: Sanitize `newFilename`
	console.log('diskBus', 'rename-file', folder, filename, newFilename)
	if (folder && filename) {
		ipcRenderer.invoke('rename-file', folder, filename, newFilename)
			.then((result) => {
				diskBus.emit('file-renamed', result)
			})
	} else {
		diskBus.emit('file-renamed', newFilename)
	}
})

window.diskBus = diskBus
