const PANEL_HEIGHT = 320

class XTerm extends Component {
  constructor(id, state, emit) {
    super(id)
    this.term = state.term
    this.resizeTerm = this.resizeTerm.bind(this)
  }

  load(element) {
    this.term.open(element)
    this.term.write("\r\nRead, Evaluate, Print and Loop! ;)\r\n>>> ")
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
    if (document.querySelector('.panel')) {
      let handleSize = 45
      const parentStyle = window.getComputedStyle(document.querySelector('.panel'))
      const parentWidth = parseInt(parentStyle.getPropertyValue('width'))
      const cols = Math.floor(parentWidth / this.term._core._renderService.dimensions.actualCellWidth) - 6
      const rows = Math.floor((PANEL_HEIGHT-handleSize) / this.term._core._renderService.dimensions.actualCellHeight) - 2
      this.term.resize(cols, rows)
    }
  }
}

function ReplOperations(state, emit) {
  return [
    Button({
      icon: 'copy.svg',
      size: 'small',
      tooltip: 'Copy',
      onClick: () => document.execCommand('copy')
    }),
    Button({
      icon: 'paste.svg',
      size: 'small',
      tooltip: 'Paste',
      onClick: () => document.execCommand('paste')
    }),
    Button({
      icon: 'delete.svg',
      size: 'small',
      tooltip: 'Clean',
      onClick: () => emit('clean-terminal')
    })
  ]
}

function ReplPanel(state, emit) {
  const terminalEl = state.cache(XTerm, 'terminal')
  let height = state.isPanelOpen ? PANEL_HEIGHT : 45

  const onToggle = () => emit('toggle-panel')
  const termOperationsVisibility = state.isPanelOpen ? 'visible' : 'hidden'

  return html`
    <div class="panel" style="height: ${height}px">
      <div class="panel-bar">
        <div class="term-operations ${termOperationsVisibility}">
          ${ReplOperations(state, emit)}
        </div>
        ${Button({
          icon: `arrow-${state.isPanelOpen ? 'down' : 'up'}.svg`,
          size: 'small',
          onClick: onToggle
        })}
      </div>

      <div class="${state.isConnected ? 'terminal-enabled' : 'terminal-disabled'}">
        ${terminalEl.render()}
      </div>

    </div>
  `
}
