function store(state, emitter) {
  const serial = window.BridgeSerial
  const disk = {}

  state.ports = []
  state.diskFiles = []
  state.serialFiles = []
  state.selectedFile = 'undefined'
  state.selectedDevice = 'disk'

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
    state.isConnected = false
    state.isTerminalOpen = false
    emitter.emit('render')
  })
  emitter.on('connect', async (path) => {
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
    state.isPortDialogOpen = false
    state.isTerminalOpen = true
    emitter.emit('render')
  })

  emitter.on('run', async () => {
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

}
