const PANEL_HEIGHT = 320

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

  if (state.diskFiles == null) {
    emit('load-disk-files')
    return html`<div id="app"><p>Loading files...</p></div>`
  }

  if (state.isRemoving) return html`<div id="app"><p>Removing...</p></div>`
  if (state.isConnecting) return html`<div id="app"><p>Connecting...</p></div>`
  if (state.isLoadingFiles) return html`<div id="app"><p>Loading files...</p></div>`
  if (state.isSaving) return html`<div id="app"><p>Saving file... ${state.savingProgress}</p></div>`
  if (state.isTransferring) return html`<div id="app"><p>Transferring file... ${state.transferringProgress}</p></div>`

  return state.view == 'editor' ? EditorView(state, emit) : FileManagerView(state, emit)
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
