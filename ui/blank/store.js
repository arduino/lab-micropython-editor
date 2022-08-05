const log = console.log

function store(state, emitter) {
  const serial = window.BridgeSerial

  state.ports = []
  state.isConnected = false

  emitter.on('load-ports', async () => {
    log('load-ports')
    state.ports = await serial.loadPorts()
    emitter.emit('render')
  })

  emitter.on('connect', async (device) => {
    log('connect', device)
    await serial.connect(device)
    serial.onData((data) => {
      let terminal = document.querySelector('#terminal')
      let text = new TextDecoder().decode(data)
      terminal.innerHTML += `<p>${text}</p>`
    })
    state.isConnected = true
    emitter.emit('render')
  })

  emitter.on('disconnect', async () => {
    log('disconnect')
    await serial.disconnect()
    state.isConnected = false
    emitter.emit('render')
  })

  emitter.on('run', async () => {
    let code = document.querySelector('textarea').value
    log('run', code)
    let result = await serial.run(code)
    log('end-run', result)
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
    emitter.emit('render')
  })
}
