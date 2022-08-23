function Panel(state, emit) {
  let openClass = state.isTerminalOpen || state.isFilesOpen ? 'open' : ''
  return html`
    <div id="panel" class=${openClass}>
      ${state.isTerminalOpen ? PanelTerminal(state, emit) : null}
      ${state.isFilesOpen ? PanelFiles(state, emit) : null}
    </div>
  `
}
