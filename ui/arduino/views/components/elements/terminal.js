class XTerm extends Component {
  constructor(id, state, emit) {
    super(id)
    this.term = new Terminal({
      fontSize: 16,
      fontFamily: '"CodeFont", monospace',
      fontWeight: 'normal',
      lineHeight: 1.2,
      theme: {
        background:          '#0d1b2a',
        foreground:          '#e0eaea',
        cursor:              '#ffffff',
        cursorAccent:        '#0d1b2a',
        selectionBackground: 'rgba(0, 212, 170, 0.25)',
        black:               '#1e2d3d',
        red:                 '#ff6b6b',
        green:               '#4ecdc4',
        yellow:              '#ffd166',
        blue:                '#5b9bd5',
        magenta:             '#c792ea',
        cyan:                '#00d4aa',
        white:               '#e0eaea',
        brightBlack:         '#4a6070',
        brightRed:           '#ff8e8e',
        brightGreen:         '#7be4dc',
        brightYellow:        '#ffe599',
        brightBlue:          '#80b8e8',
        brightMagenta:       '#d6b0f5',
        brightCyan:          '#33dfbb',
        brightWhite:         '#f5fafa',
      }
    })
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
