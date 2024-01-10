class XTerm extends Component {
  constructor(id, state, emit) {
    super(id)
    this.term = new Terminal()
    this.resizeTerm = this.resizeTerm.bind(this)
  }

  load(element) {
    this.term.open(element)
    this.resizeTerm()
    window.addEventListener('resize', this.resizeTerm)
  }

  createElement() {
    return html`<div class="terminal-wrapper"></div>`
  }

  update() {
    this.resizeTerm()
    return false
  }

  resizeTerm() {
    if (document.querySelector('#panel')) {
      let handleSize = 45
      const parentStyle = window.getComputedStyle(document.querySelector('#panel'))
      const parentWidth = parseInt(parentStyle.getPropertyValue('width'))
      const cols = Math.floor(parentWidth / this.term._core._renderService.dimensions.actualCellWidth) - 6
      const rows = Math.floor((PANEL_HEIGHT-handleSize) / this.term._core._renderService.dimensions.actualCellHeight) - 2
      this.term.resize(cols, rows)
    }
  }
}
