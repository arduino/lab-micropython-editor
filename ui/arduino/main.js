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

  if (state.view == 'file-manager') {
    return html`
      <div id="app">
        ${FileManagerView(state, emit)}
        ${Overlay(state, emit)}
      </div>
    `
  } else {
    return html`
      <div id="app">
        ${EditorView(state, emit)}
        ${Overlay(state, emit)}
      </div>
    `
  }
  return html`
    <div id="app">
      ${Overlay(state, emit)}
    </div>
  `
}

window.addEventListener('load', () => {
  let app = Choo()
  app.use(store);
  app.route('*', App)
  app.mount('#app')
  app.emitter.on('DOMContentLoaded', () => {
    if (app.state.diskNavigationRoot) {
      app.emitter.emit('refresh-files')
    }
  })
})
