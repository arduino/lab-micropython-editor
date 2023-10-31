function store(state, emitter) {
  const log = console.log
  const serial = window.BridgeSerial


  state.editor = state.cache(CodeMirrorEditor, 'editor')

  // TERMINAL PANEL
  const term = new Terminal();
  state.term = term
  state.isPanelOpen = false
  emitter.on('toggle-panel', () => {
    log('toggle-panel')
    if (state.isPanelOpen) {
      state.isPanelOpen = false
    } else {
      state.isPanelOpen = true
    }
    emitter.emit('render')
    state.cache(XTerm, 'terminal').render()
  })
  emitter.on('clean-terminal', () => {
    state.cache(XTerm, 'terminal').term.clear()
  })


  // DIALOGS
  state.dialogs = {}
  emitter.on('open-connection-dialog', async () => {
    log('open-connection-dialog')
    emitter.emit('disconnect')
    state.isPanelOpen = false
    state.dialogs['connection'] = true
    state.availablePorts = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('close-dialog', () => {
    log('close-dialog')
    Object.keys(state.dialogs).forEach(k => {
      state.dialogs[k] = false
    })
    emitter.emit('render')
  })

  // CONNECTION
  state.availablePorts = []
  emitter.on('load-ports', async () => {
    state.availablePorts = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('disconnect', async () => {
    log('disconnect')
    if (state.isConnected) {
      emitter.emit('message', 'Disconnected')
    }
    state.serialPort = null
    state.isConnected = false
    state.isPanelOpen = false

    await serial.disconnect()

    emitter.emit('render')
  })
  emitter.on('connect', async (port) => {
    const path = port.path
    log('connect', path)

    state.blocking = true
    emitter.emit('message', 'Connecting')

    await serial.connect(path)

    // Stop whatever is going on
    // Recover from getting stuck in raw repl
    await serial.get_prompt()

    state.isConnected = true
    state.isPanelOpen = true
    emitter.emit('close-dialog')

    // Make sure there is a lib folder
    log('creating lib folder')
    await serial.createFolder('lib')
    state.serialPort = path

    emitter.emit('message', 'Connected', 1000)

    emitter.emit('render')

    // Bind terminal
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
  })

  // CODE EXECUTION
  emitter.on('run', async () => {
    log('run')
    state.isPanelOpen = true
    const code = state.editor.editor.state.doc.text.join('\n')
    await serial.get_prompt()
    serial.run(code)
    emitter.emit('render')
  })
  emitter.on('stop', async () => {
    log('stop')
    await serial.get_prompt()
    emitter.emit('render')
  })
  emitter.on('reset', async () => {
    log('reset')
    await serial.reset()
    emitter.emit('update-files')
    emitter.emit('render')
  })
}
