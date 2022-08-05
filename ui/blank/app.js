function App(state, emit) {
  return html`
    <div id="app" class="column fill">
      <div class="column">
        <button onclick=${() => emit('load-ports')}>Refresh ports</button>
        Connect to board:
        <ul class="column">
          ${state.ports.map((p) => {
            return html`<li onclick=${() => emit('connect', p.path)}>${p.path}</li>`
          })}
        </ul>
      </div>

      <div>
        Connected: <strong>${state.isConnected}</strong>
        <button onclick=${() => emit('disconnect')}>Disconnect</button>
      </div>

      <div class="row">
        <button onclick=${() => emit('run')}>Run</button>
        <button onclick=${() => emit('stop')}>Stop</button>
        <button onclick=${() => emit('reset')}>Reset</button>
      </div>

<textarea id="editor" rows="20">
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
</textarea>

      <div id="terminal"></div>

      <!-- Serial: List files, open file in editor, download, rename, remove -->

      <!-- Disk: Pick local folder, list files, open file in editor, upload, rename, remove -->

    </div>
  `
}

window.addEventListener('load', () => {
  let app = Choo()
  app.use(store);
  app.route('*', App)
  app.mount('#app')
})
