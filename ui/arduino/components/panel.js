function Panel(state, emit) {
  let open = state.isTerminalOpen || state.isFilesOpen
  let openClass = open ? 'open' : ''
  let panelHeight = open ? `height: ${state.panelHeight}` : ''
  return html`
    <div id="panel" class=${openClass} style="${panelHeight}">
      ${open ? html`<div id="handle" onmousedown=${() => emit('start-resizing-panel')}></div>` : null}
      ${state.isTerminalOpen ? PanelTerminal(state, emit) : null}
      ${state.isFilesOpen ? PanelFiles(state, emit) : null}
    </div>
  `
}
