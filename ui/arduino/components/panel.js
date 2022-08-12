function Panel(state, emit) {
  return html`
    <div id="panel">
      ${state.isTerminalOpen ? PanelTerminal(state, emit) : null}
      ${state.isFilesOpen ? PanelFiles(state, emit) : null}
    </div>
  `
}
