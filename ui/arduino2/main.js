const PANEL_HEIGHT = 320

function App(state, emit) {
  if (state.diskNavigationRoot == null) {
    return html`
      <div id="app" onclick=${() => emit('open-folder')} style="cursor: pointer;">
        <p>
          In order to use <strong>Lab for MicroPython Editor</strong>, <br>
          you must choose where to store your files. <br><br>
          Click anywhere to select a folder on your computer.
        </p>
      </div>
    `
  }

  if (state.diskFiles == null) {
    emit('load-disk-files')
    return html`
<<<<<<< Updated upstream
      <div id="app" onclick=${() => emit('open-folder')} style="cursor: pointer;">
=======
      <div id="app">
>>>>>>> Stashed changes
        <p>
          Loading files...
        </p>
      </div>
    `
  }


  return html`
    <div id="app">
      <div class="working-area">
        ${Toolbar(state, emit)}
        ${Tabs(state, emit)}
        ${CodeEditor(state, emit)}
        ${ReplPanel(state, emit)}
      </div>
      ${ConnectionDialog(state, emit)}
    </div>
  `
}

window.addEventListener('load', () => {
  let app = Choo()
  app.use(store);
  app.route('*', App)
  app.mount('#app')

})
