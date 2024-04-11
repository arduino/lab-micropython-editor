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
    // XXX: This should not be querying the DOM like that :o
    if (document.querySelector('#panel')) {
      const parentStyle = window.getComputedStyle(document.querySelector('#panel'))
      const parentWidth = parseInt(parentStyle.getPropertyValue('width'))
      const parentHeight = parseInt(parentStyle.getPropertyValue('height'))
      const cols = Math.floor(parentWidth / this.term._core._renderService.dimensions.actualCellWidth) - 6
      const rows = Math.floor((parentHeight-PANEL_CLOSED) / this.term._core._renderService.dimensions.actualCellHeight) - 2
      this.term.resize(cols, rows)
    }
  }
}
