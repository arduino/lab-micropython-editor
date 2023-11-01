class XTerm extends Component {
  constructor(id, state, emit) {
    super(id)
    this.term = new Terminal()
    this.resizeTerm = this.resizeTerm.bind(this)
  }

  load(element) {
    console.log('load', element)
    this.term.open(element)
    this.term.write("\r\nRead, Evaluate, Print and Loop! ;)\r\n>>> ")
    this.resizeTerm()
    window.addEventListener('resize', this.resizeTerm)
  }

  createElement(a,b) {
    console.log('create', a, b)
    return html`<div class="terminal-wrapper"></div>`
  }

  update(el) {
    console.log('update')
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
      console.log('resize', cols, rows)
    }
  }
}
