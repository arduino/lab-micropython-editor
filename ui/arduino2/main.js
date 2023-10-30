function App(state, emit) {
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
