function ReplPanel(state, emit) {
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
      ${state.cache(XTerm, 'terminal').render()}
    </div>
  `
}

// <div class="${state.isConnected ? 'terminal-enabled' : 'terminal-disabled'}">
// </div>

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
