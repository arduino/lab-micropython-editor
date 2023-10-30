function store(state, emitter) {
  const serial = window.BridgeSerial

  const term = new Terminal();
  state.term = term

  state.isPanelOpen = false
  state.dialogs = {}

  state.availablePorts = []

  emitter.on('toggle-panel', () => {
    console.log('toggle-panel')
    if (state.isPanelOpen) {
      state.isPanelOpen = false
    } else {
      state.isPanelOpen = true
    }
    emitter.emit('render')
    state.cache(XTerm, 'terminal').render()
  })

  emitter.on('open-connection-dialog', async () => {
    console.log('open-connection-dialog')
    state.isPanelOpen = false
    state.dialogs['connection'] = true
    state.availablePorts = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('load-ports', async () => {
    state.availablePorts = await serial.loadPorts()
    emitter.emit('render')
  })

  emitter.on('close-dialog', () => {
    console.log('close-dialog')
    Object.keys(state.dialogs).forEach(k => {
      state.dialogs[k] = false
    })
    emitter.emit('render')
  })
}
