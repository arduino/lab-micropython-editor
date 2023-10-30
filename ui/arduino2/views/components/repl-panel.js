const PANEL_HEIGHT = 320

class XTerm extends Component {
  constructor(id, state, emit) {
    super(id)
    this.term = new Terminal()
    this.resizeTerm = this.resizeTerm.bind(this)
  }

  load(element) {
    this.term.open(element)
    this.term.write("Read, Evaluate, Print and Loop! ;)\r\n>>>")
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
    if (
      this.term._core._renderService.dimensions.actualCellWidth == 0
      || this.term._core._renderService.dimensions.actualCellHeight == 0
    ) {
      let handleSize = 45
      const parentStyle = window.getComputedStyle(document.querySelector('#panel'))
      const parentWidth = parseInt(parentStyle.getPropertyValue('width'))
      const parentHeight = parseInt(parentStyle.getPropertyValue('height'))
      const cols = Math.floor(parentWidth / this.term._core._renderService.dimensions.actualCellWidth)
      const rows = Math.floor((parentHeight-handleSize) / this.term._core._renderService.dimensions.actualCellHeight) - 1
      this.term.resize(cols, rows)
    }
  }
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
          ${Button({
            icon: 'copy.svg',
            size: 'small',
            tooltip: 'Copy'
          })}
          ${Button({
            icon: 'paste.svg',
            size: 'small',
            tooltip: 'Paste'
          })}
          ${Button({
            icon: 'delete.svg',
            size: 'small',
            tooltip: 'Clean'
          })}
        </div>

        ${Button({
          icon: `arrow-${state.isPanelOpen ? 'down' : 'up'}.svg`,
          size: 'small',
          onClick: onToggle
        })}

      </div>
      ${terminalEl.render()}
    </div>
  `

  //
  // } else {
  //   return html`
  //     <div class="panel" style="height: 45px">
  //       <div class="panel-bar">
  //         <div class="button">
  //           <button class="small" onclick=${onToggle}><img class="icon" src="media/arrow-up.svg" /></button>
  //         </div>
  //       </div>
  //       ${terminalEl.render()}
  //     </div>
  //   `
  // }
}
