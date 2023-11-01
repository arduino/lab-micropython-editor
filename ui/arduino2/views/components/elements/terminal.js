class XTerm extends Component {
  constructor(id, state, emit) {
<<<<<<< Updated upstream
=======
    console.log('term constructor')
>>>>>>> Stashed changes
    super(id)
    this.term = new Terminal()
    this.resizeTerm = this.resizeTerm.bind(this)
  }

  load(element) {
<<<<<<< Updated upstream
    console.log('load', element)
=======
    console.log('term load', element)
>>>>>>> Stashed changes
    this.term.open(element)
    this.term.write("\r\nRead, Evaluate, Print and Loop! ;)\r\n>>> ")
    this.resizeTerm()
    window.addEventListener('resize', this.resizeTerm)
  }

<<<<<<< Updated upstream
  createElement(a,b) {
    console.log('create', a, b)
    return html`<div class="terminal-wrapper"></div>`
  }

  update(el) {
    console.log('update')
=======
  createElement() {
    console.log('term create')
    return html`<div id="terminal-wrapper"></div>`
  }

  update(el) {
    console.log('term update')
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      console.log('resize', cols, rows)
=======
      console.log('term resize', cols, rows)
>>>>>>> Stashed changes
    }
  }
}
