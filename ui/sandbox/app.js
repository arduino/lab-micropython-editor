function App(state, emit) {
  const editor = state.editors[state.value1]
  return html`
    <div id="app">
      <div class="working-area">
          <button>${state.value1}</button> ${`=>`}
          <button onclick=${() => emit('change-value1', -1)}>-</button> /
          <button onclick=${() => emit('change-value1', 1)}>+</button>
          ${editor.render(editor.content)}
          ${state.isTerminalOpen ? state.cache(XTerm, 'terminal').render() : null}
          <button onclick=${() => emit('toggle-terminal', 1)}>x</button>
      </div>
    </div>
  `
}

function store(state, emitter) {
  state.value1 = 0
  state.editors = [
    state.cache(CodeMirrorEditor, `id_0`),
    state.cache(CodeMirrorEditor, `id_1`),
    state.cache(CodeMirrorEditor, `id_2`)
  ]

  emitter.on('change-value1', (d) => {
    console.log('change-value')
    state.value1 = Math.abs(state.value1 + d) % 3
    emitter.emit('render')
  })

  emitter.on('toggle-terminal', () => {
    state.isTerminalOpen = !state.isTerminalOpen
    emitter.emit('render')
  })
}

window.addEventListener('load', () => {
  let app = Choo()
  app.use(store);
  app.route('*', App)
  app.mount('#app')

})

class XTerm extends Component {
  constructor(id, state, emit) {
    console.log('term constructor')
    super(id)
    this.term = new Terminal()
    this.resizeTerm = this.resizeTerm.bind(this)
  }

  load(element) {
    console.log('term load', element)
    this.term.open(element)
    this.term.write("\r\nRead, Evaluate, Print and Loop! ;)\r\n>>> ")
    this.resizeTerm()
    window.addEventListener('resize', this.resizeTerm)
  }

  createElement() {
    console.log('term create')
    return html`<div id="terminal-wrapper"></div>`
  }

  update(el) {
    console.log('term update')
    this.resizeTerm()
    return false
  }

  resizeTerm() {
    if (document.querySelector('.panel')) {
      let handleSize = 45
      const parentStyle = window.getComputedStyle(document.querySelector('.panel'))
      const parentWidth = parseInt(parentStyle.getPropertyValue('width'))
      const cols = Math.floor(parentWidth / this.term._core._renderService.dimensions.actualCellWidth) - 6
      const rows = Math.floor((PANEL_HEIGHT-handleSize) / this.term._core._renderService.dimensions.actualCellHeight) - 2
      this.term.resize(cols, rows)
      console.log('term resize', cols, rows)
    }
  }
}

class CodeMirrorEditor extends Component {
  constructor() {
    console.log('cm constructor')
    super()
    this.editor = null
    this.content = '' + Math.random()
  }

  load(el) {
    console.log('cm load', el)
    const onCodeChange = (update) => {
      console.log('code change')
      this.content = update.state.doc.toString()
    }
    this.editor = createEditor(this.content, el, onCodeChange)

  }

  createElement(content) {
    console.log('cm create')
    if (content) this.content = content
    return html`<div class="code-editor"></div>`
  }

  update(content) {
    console.log('cm update', content, this.element)
    return false
  }

}
