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
        <button onclick=${() => emit('save-serial')}>Save</button>
        <input id="filename" value="main.py" />
      </div>

      <textarea id="editor" rows="20">${state.code}</textarea>

      <div id="terminal"></div>

      <div>
        <button onclick=${() => emit('list-files-serial')}>List files</button>
        <ul>
          ${state.serialFiles.map((file) => {
            return html`
              <li>
                <button onclick=${() => emit('load-file-serial', file)}>Load</button>
                <button onclick=${() => emit('remove-file-serial', file)}>Remove</button>
                ${file}
              </li>
            `
          })}
        </ul>
      </div>

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
