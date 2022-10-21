function Panel(state, emit) {
  let open = state.isTerminalOpen || state.isFilesOpen
  let openClass = open ? 'open' : ''
  let panelHeight = open ? `height: ${state.panelHeight}` : ''
  return html`
    <div id="panel" class=${openClass} style="${panelHeight}">
      ${open ? PanelHandle(state, emit) : null}
      ${state.isTerminalOpen ? PanelTerminal(state, emit) : null}
      ${state.isFilesOpen ? PanelFiles(state, emit) : null}
    </div>
  `
}

function PanelHandle(state, emit) {
  let clear = html`
    <button class="panel-button" onclick=${() => emit('clean-terminal')}>
      <img src="icons/Delete.svg" />
    </button>
  `
  return html`
    <div id="handle" onmousedown=${() => emit('start-resizing-panel')}>
      ${state.isTerminalOpen ? clear : null}
    </div>
    `
}
