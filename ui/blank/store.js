const log = console.log

function store(state, emitter) {
  const serial = window.BridgeSerial

  state.code = `
from machine import Pin
from time import sleep

led = Pin(6, Pin.OUT)
while True:
 print('ping')
 led.on()
 sleep(0.5)
 print('pong')
 led.off()
 sleep(0.5)
`

  state.ports = []
  state.isConnected = false

  state.serialFiles = []
  state.diskFiles = []

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
    state.code = code
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

  emitter.on('list-files-serial', async () => {
    log('list-files-serial')
    let files = await serial.listFiles()
    state.serialFiles = files
    emitter.emit('render')
  })

  emitter.on('load-file-serial', async (file) => {
    log('load-file-serial', file)
    let content = await serial.loadFile(file)
    state.code = content
    emitter.emit('render')
  })

  emitter.on('remove-file-serial', async (file) => {
    log('remove-file-serial', file)
    let content = await serial.removeFile(file)
    emitter.emit('list-files-serial')
  })

  emitter.on('save-serial', async () => {
    let filename = document.querySelector('#filename').value
    let code = document.querySelector('textarea').value
    state.code = code
    await serial.saveFileContent(state.code, filename)
    emitter.emit('list-files-serial')
  })
}
