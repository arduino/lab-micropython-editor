function PanelTerminal(state, emit) {
  return state.cache(XTerm, 'terminal').render()
}

class XTerm extends Component {
  constructor(id, state, emit) {
    super(id)
    this.term = new Terminal()
    // this.term.onData((data) => emit('terminal-input', data))
    this.resizeTerm = this.resizeTerm.bind(this)
  }

  load(element) {
    this.term.open(element)
    this.resizeTerm()
    window.addEventListener('resize', this.resizeTerm)
  }

  createElement() {
    return html`<div id="terminal"></div>`
  }

  update() {
    this.resizeTerm()
    return false
  }

  resizeTerm() {
    const parentStyle = window.getComputedStyle(document.querySelector('#panel'))
    const parentWidth = parseInt(parentStyle.getPropertyValue('width'))
    const parentHeight = parseInt(parentStyle.getPropertyValue('height'))
    const cols = Math.floor(parentWidth / this.term._core._renderService.dimensions.actualCellWidth)
    const rows = Math.floor(parentHeight / this.term._core._renderService.dimensions.actualCellHeight)
    this.term.resize(cols, rows)
  }
}
