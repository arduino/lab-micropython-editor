function App(state, emit) {
  return html`
    <div id="app">
      <div class="overlay"></div>
      <div class="working-area">
        ${Toolbar(state, emit)}
        ${Tabs(state, emit)}
        ${CodeEditor(state, emit)}
        <div class="panel"></div>
      </div>
    </div>
  `
}

window.addEventListener('load', () => {
  let app = Choo()
  // app.use(store);
  app.route('*', App)
  app.mount('#app')
})
