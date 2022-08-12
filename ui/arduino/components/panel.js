function Panel(state, emit) {
  if (!state.isTerminalOpen && !state.isFilesOpen) return null
  return html`
    <div id="panel">
      ${state.isTerminalOpen ? PanelTerminal(state, emit) : null}
      ${state.isFilesOpen ? PanelFiles(state, emit) : null}
    </div>
  `
}
