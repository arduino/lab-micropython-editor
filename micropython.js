const EventEmitter = require('events')
const SerialPort = require('serialport')

const codeListFiles = `
from os import listdir
print('<BEGINREC>')
print(listdir())
print('<ENDREC>')
`
const codeLoadFile = (path) => {
	return `
print('<BEGINREC>')
with open('${path}', 'r') as f:
	line = f.readline()
	while line != '':
		print(line, end='')
		line = f.readline()
print('<ENDREC>')
`
}

const codeRemoveFile = (path) => {
	return `
from os import remove
remove('${path}')
`
}

const codeRenameFile = (oldPath, newPath) => {
	return `
from os import rename
rename('${oldPath}', '${newPath}')
`
}

const codeCollectGarbage = `import gc
gc.collect()`

class SerialConnection extends EventEmitter {
	constructor() {
		super()
		this.rawRepl = false
		this.loadingFile = false
		this.loadingFileList = false
	}
	/**
	* List all available serial ports (with vendor id)
	* @return {Promise} Resolves with an array of port objects
	*/
	static listAvailable() {
		return new Promise((resolve, reject) => {
			SerialPort.list().then((ports) => {
				const availablePorts = ports.filter((port) => {
					return !!port.vendorId
				})
				if (availablePorts) {
					resolve(availablePorts)
				} else {
					reject(new Error('No ports available'))
				}
			})
		})
	}
	/**
	* Opens a connection on a given port.
	* @param {String} port Port address to open the connection
	*/
	open(port) {
		this.port = new SerialPort(port, {
			baudRate: 115200,
			autoOpen: false
		})
		this.port.on('open', () => {
			this.emit('connected')
			this.port.write('\r')
		})
		this.port.on('data', (data) => this._eventHandler(data))
		this.port.open()
	}
	/**
	* Closes current connection.
	*/
	close() {
		this.emit('disconnected')
		if (this.port) {
			this.port.close()
		}
	}
	/**
	* Executes code in a string format. This code can contain multiple lines.
	* @param {String} code String of code to be executed. Line breaks must be `\n`
	*/
	execute(code) {
		// TODO: break code in lines and `_execRaw` line by line
		this.stop()
		this._enterRawRepl()
		this._executeRaw(code)
		.then(() => {
			this._exitRawRepl()
		})
	}
	/**
	* Evaluate a command/expression.
	* @param {String} command Command/expression to be evaluated
	*/
	evaluate(command) {
		this.port.write(Buffer.from(command))
	}
	/**
	* Send a "stop" command in order to interrupt any running code. For serial
	* REPL this command is "CTRL-C".
	*/
	stop() {
		this.port.write('\r\x03') // CTRL-C
	}
	/**
	* Send a command to "soft reset".
	*/
	softReset() {
		this.stop();
		this.port.write('\r\x04') // CTRL-D
	}
	/**
	* Prints on console the existing files on file system.
	*/
	listFiles() {
		this.data = ''
		this.loadingFileList = true
		this.execute(codeListFiles)
	}
	/**
	* Prints on console the content of a given file.
	* @param {String} path File's path
	*/
	loadFile(path) {
		this.data = ''
		this.loadingFile = true
		this.execute(codeLoadFile(path))
	}
	/**
	* Writes a given content to a file in the file system.
	* @param {String} path File's path
	* @param {String} content File's content
	*/
	writeFile(path, content) {
		if (!path || !content) {
			return
		}
		// TODO: Find anoter way to do it without binascii
		let pCode = `f = open('${path}', 'w')\n`
		// pCode += `import gc; gc.collect()\n`
		pCode += codeCollectGarbage + '\n'
		// `content` is what comes from the editor. We want to write it
		// line one by one on a file so we split by `\n`
		var lineCount = 0;
		var lines = content.split('\r\n')
		lines.forEach((line) => {
			if (line) {
				var nlMarker = line.indexOf('\n');
				var crMarker = line.indexOf('\r');
				// TODO: Sanitize line replace """ with \"""
				// To avoid the string escaping with weirdly we encode
				// the line plus the `\n` that we just removed to base64
				pCode += `f.write("""${line}""")`
				if(lineCount != lines.length - 1){
					pCode += `\nf.write('\\n')\n`
				}
				lineCount++;
			}
		})
		pCode += `\nf.close()\n`
		this.execute(pCode)
	}

	/**
	* Removes file on a given path
	* @param {String} path File's path
	*/
	removeFile(path) {
		this.execute(codeRemoveFile(path))
	}

	renameFile(oldPath, newPath) {
		this.execute(codeRenameFile(oldPath, newPath))
	}
	/**
	* Handles data comming from connection
	* @param {Buffer} buffer Data comming from connection
	*/
	_eventHandler(buffer) {
		const data = buffer.toString()
		this.emit('output', data)

		// Getting data that should be sent to frontend
		// Loading file content, listing files, etc
		// if (data.indexOf('<REC>') !== -1) {
		// 	this.recordingData = true
		// }
		// if (this.recordingData) {
		// 	this.data += data
		// }
		// if (data.indexOf('<EOF>') !== -1) {
		// 	const iofREC = this.data.indexOf('<REC>')
		// 	const rec = this.data.indexOf('<REC>\r\n')+7
		// 	const eof = this.data.indexOf('<EOF>')
		// 	if (this.loadingFile) {
		// 		this.emit('file-loaded', this.data.slice(rec, eof))
		// 		this.loadingFile = false
		// 	}
		// 	if (this.loadingFileList) {
		// 		this.emit('file-list-loaded', this.data.slice(rec, eof))
		// 		this.loadingFileList = false
		// 	}
		// 	this.recordingData = false
		// }

		if (this.rawRepl && data.indexOf('\n>>> ') != -1) {
			this.emit('execution-finished')
			this.rawRepl = false
		}

		if (!this.rawRepl && data.indexOf('raw REPL;') != -1) {
			this.emit('execution-started')
			this.rawRepl = true
		}
	}
	/**
	* Put REPL in raw mode
	*/
	_enterRawRepl() {
		this.port.write('\r\x01') // CTRL-A
	}
	/**
	* Exit REPL raw mode
	*/
	_exitRawRepl() {
		this.port.write('\r\x04\r\x02') // CTRL-D // CTRL-B
	}
	/**
	* Writes a command to connected port
	* @param {String} command Command to be written on connected port
	*/
	_executeRaw(command) {
		const writePromise = (buffer) => {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					this.port.write(buffer, (err) => {
						if (err) return reject()
						resolve()
					})
				}, 1)
			})
		}
		const l = 1024
		let slices = []
		for(let i = 0; i < command.length; i+=l) {
			let slice = command.slice(i, i+l)
			slices.push(slice)
		}
		return new Promise((resolve, reject) => {
			slices.reduce((cur, next) => {
				return cur.then(() => {
					return writePromise(next)
				})
			}, Promise.resolve())
			.then()
			.then(() => {
				resolve()
			})
		})
	}
}

module.exports = SerialConnection
