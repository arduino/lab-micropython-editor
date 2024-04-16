function ReplPanel(state, emit) {
  const onToggle = () => {
    if (state.panelHeight > PANEL_CLOSED) {
      emit('close-panel')
    } else {
      emit('open-panel')
    }
  }
  const panelOpenClass = state.isPanelOpen ? 'open' : 'closed'
  const termOperationsVisibility = state.panelHeight > PANEL_TOO_SMALL ? 'visible' : 'hidden'
  const terminalDisabledClass = state.isConnected ? 'terminal-enabled' : 'terminal-disabled'

  return html`
    <div id="panel" style="height: ${state.panelHeight}px">
      <div class="panel-bar">
        <div id="drag-handle"
          onmousedown=${() => emit('start-resizing-panel')}
          onmouseup=${() => emit('stop-resizing-panel')}
          ></div>
        <div class="term-operations ${termOperationsVisibility}">
          ${ReplOperations(state, emit)}
        </div>
        ${Button({
          icon: `arrow-${state.panelHeight > PANEL_CLOSED ? 'down' : 'up'}.svg`,
          size: 'small',
          onClick: onToggle
        })}
      </div>
      <div class=${terminalDisabledClass}>
        ${state.cache(XTerm, 'terminal').render()}
      </div>
    </div>
  `
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
      onClick: () => emit('clear-terminal')
    })
  ]
}
