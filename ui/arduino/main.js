const PANEL_CLOSED = 45
const PANEL_TOO_SMALL = 65
const PANEL_DEFAULT = 320

function App(state, emit) {
  if (state.diskNavigationRoot == null) {
    return html`
      <div
        id="app"
        onclick=${() => emit('select-disk-navigation-root')}
        style="cursor: pointer;"
        >
        <p style="max-width: 420px">
          In order to use <strong>Lab for MicroPython Editor</strong>
          you must choose where to store your files. <br><br>
          Click anywhere to select a folder on your computer.
        </p>
      </div>
    `
  }

  let overlay = html`<div id="overlay" class="closed"></div>`

  if (state.diskFiles == null) {
    emit('load-disk-files')
    overlay = html`<div id="overlay" class="open"><p>Loading files...</p></div>`
  }

  if (state.isRemoving) overlay = html`<div id="overlay" class="open"><p>Removing...</p></div>`
  if (state.isConnecting) overlay = html`<div id="overlay" class="open"><p>Connecting...</p></div>`
  if (state.isLoadingFiles) overlay = html`<div id="overlay" class="open"><p>Loading files...</p></div>`
  if (state.isSaving) overlay = html`<div id="overlay" class="open"><p>Saving file... ${state.savingProgress}</p></div>`
  if (state.isTransferring) overlay = html`<div id="overlay" class="open"><p>Transferring file... ${state.transferringProgress}</p></div>`

  const view = state.view == 'editor' ? EditorView(state, emit) : FileManagerView(state, emit)
  return html`
    <div id="app">
      ${view}
      ${overlay}
    </div>
  `

}

window.addEventListener('load', () => {
  let app = Choo()
  app.use(store);
  app.route('*', App)
  app.mount('#app')

  app.emitter.on('DOMContentLoaded', () => {
    app.emitter.emit('refresh-files')
  })

})
