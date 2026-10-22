const PANEL_CLOSED = 45
const PANEL_TOO_SMALL = 65
const PANEL_DEFAULT = 320

function App(state, emit) {
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
