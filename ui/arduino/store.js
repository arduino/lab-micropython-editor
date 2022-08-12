function store(state, emitter) {
  const serial = window.BridgeSerial
  const disk = {}

  state.ports = []
  state.diskFiles = []
  state.serialFiles = []
  state.selectedFile = null
  state.selectedDevice = 'disk'

  state.diskFolder = null
  state.serialPath = null

  state.isConnected = false
  state.isPortDialogOpen = false
  state.isTerminalOpen = false
  state.isFilesOpen = false
  state.isEditingFilename = false
  state.isTerminalBound = false

  emitter.on('load-ports', async () => {
    state.ports = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('open-port-dialog', async () => {
    emitter.emit('disconnect')
    state.ports = await serial.loadPorts()
    state.isPortDialogOpen = true
    emitter.emit('render')
  })
  emitter.on('close-port-dialog', async () => {
    state.isPortDialogOpen = false
    emitter.emit('render')
  })

  emitter.on('disconnect', () => {
    state.serialPath = null
    state.isConnected = false
    state.isTerminalOpen = false
    state.isFilesOpen = false
    emitter.emit('render')
  })
  emitter.on('connect', async (path) => {
    state.serialPath = path
    await serial.connect(path)
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
    state.isConnected = true
    emitter.emit('close-port-dialog')
    emitter.emit('show-terminal')
    emitter.emit('render')
  })

  emitter.on('run', async () => {
    if (!state.isTerminalOpen) emitter.emit('show-terminal')
    let editor = state.cache(AceEditor, 'editor').editor
    let code = editor.getValue()
    await serial.run(code)
    emitter.emit('render')
  })

  emitter.on('stop', async () => {
    await serial.stop()
    emitter.emit('render')
  })

  emitter.on('reset', async () => {
    await serial.reset()
    emitter.emit('render')
  })

  emitter.on('new-file', () => {
    let editor = state.cache(AceEditor, 'editor').editor
    state.selectedFile = 'undefined'
    editor.setValue('')
    emitter.emit('render')
  })

  emitter.on('show-terminal', () => {
    state.isTerminalOpen = !state.isTerminalOpen
    state.isFilesOpen = false
    emitter.emit('render')
  })

  emitter.on('show-files', () => {
    state.isTerminalOpen = false
    state.isFilesOpen = !state.isFilesOpen
    emitter.emit('update-files')
    emitter.emit('render')
  })

  emitter.on('update-files', async () => {
    if (state.isConnected) {
      await serial.stop()
      state.serialFiles = await serial.listFiles()
    }
    if (state.diskFolder) {
      // TODO
    }
    emitter.emit('render')
  })

  emitter.on('select-file', async (device, filename) => {
    state.selectedDevice = device
    state.selectedFile = filename

    if (state.selectedDevice === 'serial') {
      let content = await serial.loadFile(filename)
      let editor = state.cache(AceEditor, 'editor').editor
      editor.setValue(content)
    }

    emitter.emit('render')
  })

}
