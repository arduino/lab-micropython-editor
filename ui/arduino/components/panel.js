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
  const copy = Button({
    icon: 'icons/Copy.svg',
    onclick: () => document.execCommand('copy')
  })
  const paste = Button({
    icon: 'icons/Paste.svg',
    onclick: () => document.execCommand('paste')
  })
  const cleanTerminal = Button({
    icon: 'icons/Delete.svg',
    onclick: () => emit('clean-terminal')
  })

  let termControls = html`
    ${copy}
    ${paste}
    ${cleanTerminal}
  `
  return html`
    <div id="handle" onmousedown=${() => emit('start-resizing-panel')}>
      ${state.isTerminalOpen ? termControls : null}
    </div>
    `
}
