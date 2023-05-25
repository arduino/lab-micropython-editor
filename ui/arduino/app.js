function App(state, emit) {

  return html`
    <div id="app" class="column fill">
      ${Toolbar(state, emit)}
      ${FileName(state, emit)}
      <div style="position: relative; height: 100%">
        ${Editor(state, emit)}
        ${Panel(state, emit)}
      </div>
      ${NewFileDialog(state, emit)}
      ${PortDialog(state, emit)}
      ${Message(state, emit)}
      ${Blocking(state, emit)}
    </div>
  `
}

window.addEventListener('load', () => {
  let app = Choo()
  app.use(store);
  app.route('*', App)
  app.mount('#app')
})
