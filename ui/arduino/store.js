const log = console.log

function store(state, emitter) {
  const serial = window.BridgeSerial
  const disk = window.BridgeDisk

  state.ports = []
  state.diskFiles = []
  state.serialFiles = []
  state.selectedFile = null
  state.selectedDevice = 'disk'

  state.diskPath = null
  state.serialPath = null

  state.isConnected = false
  state.isPortDialogOpen = false
  state.isTerminalOpen = false
  state.isFilesOpen = false

  state.messageText = ''
  state.isShowingMessage = false
  state.messageTimeout = 0

  state.isTerminalBound = false // XXX

  // SERIAL CONNECTION
  emitter.on('load-ports', async () => {
    log('load-ports')
    state.ports = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('open-port-dialog', async () => {
    log('open-port-dialog')
    emitter.emit('disconnect')
    state.ports = await serial.loadPorts()
    state.isPortDialogOpen = true
    emitter.emit('render')
  })
  emitter.on('close-port-dialog', async () => {
    log('close-port-dialog')
    state.isPortDialogOpen = false
    emitter.emit('render')
  })

  emitter.on('disconnect', () => {
    log('disconnect')
    if (state.isConnected) {
      emitter.emit('message', 'Disconnected')
    }
    state.isConnected = false
    state.serialPath = null
    state.isTerminalOpen = false
    state.serialFiles = []
    emitter.emit('render')
  })
  emitter.on('connect', async (path) => {
    log('connect')
    state.serialPath = path
    await serial.connect(path)
    emitter.emit('message', 'Connected!')
    await serial.stop()

    let term = state.cache(XTerm, 'terminal').term
    if (!state.isTerminalBound) {
      state.isTerminalBound = true
      term.onData((data) => {
        serial.eval(data)
        term.scrollToBottom()
      })
    }
    serial.onData((data) => {
      term.write(data)
      term.scrollToBottom()
    })
    serial.onDisconnect(() => emitter.emit('disconnect'))
    state.isConnected = true
    emitter.emit('update-files')
    emitter.emit('close-port-dialog')
    emitter.emit('show-terminal')
    emitter.emit('render')
  })

  // CODE EXECUTION
  emitter.on('run', async () => {
    log('run')
    if (!state.isTerminalOpen) emitter.emit('show-terminal')
    let editor = state.cache(AceEditor, 'editor').editor
    let code = editor.getValue()
    await serial.run(code)
    emitter.emit('render')
  })
  emitter.on('stop', async () => {
    log('stop')
    await serial.stop()
    emitter.emit('render')
  })
  emitter.on('reset', async () => {
    log('reset')
    await serial.reset()
    emitter.emit('update-files')
    emitter.emit('render')
  })

  // FILE MANAGEMENT
  emitter.on('new-file', () => {
    log('new-file')
    let editor = state.cache(AceEditor, 'editor').editor
    state.selectedFile = 'undefined'
    editor.setValue('')
    emitter.emit('render')
  })
  emitter.on('save', async () => {
    log('save')
    let editor = state.cache(AceEditor, 'editor').editor
    let contents = editor.getValue()
    let filename = state.selectedFile || 'undefined'

    if (state.selectedDevice === 'serial') {
      await serial.saveFileContent(filename, contents)
    }

    if (state.selectedDevice === 'disk' && state.diskPath) {
      await disk.saveFileContent(state.diskPath, filename, contents)
    }

    emitter.emit('update-files')
  })
  emitter.on('remove', async () => {
    log('remove')
    if (state.selectedDevice === 'serial') {
      await serial.removeFile(state.selectedFile)
    }
    if (state.selectedDevice === 'disk') {
      await disk.removeFile(state.diskPath, state.selectedFile)
    }
    emitter.emit('update-files')
    emitter.emit('render')
  })
  emitter.on('select-file', async (device, filename) => {
    log('select-file')
    state.selectedDevice = device
    state.selectedFile = filename

    let content = ''
    if (state.selectedDevice === 'serial') {
      content = await serial.loadFile(filename)
      content = content.replace(//g, ``) // XXX: Remove character that breaks execution
    }

    if (state.selectedDevice === 'disk') {
      content = await disk.loadFile(state.diskPath, filename)
    }

    let editor = state.cache(AceEditor, 'editor').editor
    editor.setValue(content)

    emitter.emit('render')
  })
  emitter.on('open-folder', async () => {
    log('open-folder')
    let { folder, files } = await disk.openFolder()
    state.diskPath = folder
    state.diskFiles = files
    if (!state.isFilesOpen) emitter.emit('show-files')
    emitter.emit('render')
  })
  emitter.on('update-files', async () => {
    log('update-files')
    if (state.isConnected) {
      await serial.stop()
      try {
        state.serialFiles = await serial.listFiles()
      } catch (e) {
        console.log('error', e)
      }
    }
    if (state.diskPath) {
      try {
        state.diskFiles = await disk.listFiles(state.diskPath)
      } catch (e) {
        console.log('error', e)
      }
    }
    emitter.emit('render')
  })
  emitter.on('upload', async () => {
    await serial.uploadFile(state.diskPath, state.selectedFile)
    emitter.emit('update-files')
    emitter.emit('render')
  })
  emitter.on('download', async () => {
    await serial.downloadFile(state.diskPath, state.selectedFile)
    emitter.emit('update-files')
    emitter.emit('render')
  })

  // PANEL MANAGEMENT
  emitter.on('show-terminal', () => {
    log('show-terminal')
    state.isTerminalOpen = !state.isTerminalOpen
    state.isFilesOpen = false
    emitter.emit('render')
  })
  emitter.on('show-files', () => {
    log('show-files')
    state.isTerminalOpen = false
    state.isFilesOpen = !state.isFilesOpen
    emitter.emit('update-files')
    emitter.emit('render')
  })
  emitter.on('close-panel', () => {
    state.isTerminalOpen = false
    state.isFilesOpen = false
    emitter.emit('render')
  })

  // NAMING/RENAMING FILE
  emitter.on('save-filename', async (filename) => {
    log('save-filename', filename)
    let oldFilename = state.selectedFile
    state.selectedFile = filename

    let editor = state.cache(AceEditor, 'editor').editor
    let contents = editor.getValue()

    if (state.selectedDevice === 'serial') {
      if (state.serialFiles.indexOf(oldFilename) !== -1) {
        // If old name exists, rename file
        await serial.renameFile(oldFilename, filename)
      } else {
        // If old name doesn't exist create new file
        await serial.saveFileContent(filename, contents)
      }
    }

    if (state.diskPath !== null && state.selectedDevice === 'disk') {

      if (state.diskFiles.indexOf(oldFilename) !== -1) {
        // If old name exists, rename file
        await disk.renameFile(state.diskPath, oldFilename, filename)
      } else {
        // If old name doesn't exist create new file
        await disk.saveFileContent(state.diskPath, filename, contents)
      }
    }

    emitter.emit('update-files')
    emitter.emit('render')
  })

  emitter.on('message', (text) => {
    log('message', text)
    clearInterval(state.messageTimeout)
    state.messageText = text
    state.isShowingMessage = true
    state.messageTimeout = setTimeout(() => {
      state.isShowingMessage = false
      emitter.emit('render')
    }, 2000)
    emitter.emit('render')
  })

  window.addEventListener('resize', () => {
    console.log('resize window')
    state.cache(AceEditor, 'editor').render()
  })

}
