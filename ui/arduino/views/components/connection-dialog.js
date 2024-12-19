function ConnectionDialog(state, emit) {
  const stateClass = state.isConnectionDialogOpen ? 'open' : 'closed'
  function onClick(e) {
    if (e.target.id == 'dialog-connection') {
      emit('close-connection-dialog')
    }
  }

  function onKeyDown(e) {
    if (e.key.toLowerCase() === 'escape') {
      emit('close-connection-dialog')
    }
  }

  // Add/remove event listener based on dialog state
  if (state.isConnectionDialogOpen) {
    document.addEventListener('keydown', onKeyDown)
  } else {
    document.removeEventListener('keydown', onKeyDown)
  }

  return html`
    <div id="dialog-connection" class="dialog ${stateClass}" onclick=${onClick}>
      <div class="dialog-content">
        ${state.availablePorts.map(
          (port) => html`
            <div class="item" onclick=${() => emit('select-port', port)}>
              ${port.path}
            </div>
          `
        )}
        <div class="item" onclick=${() => emit('update-ports')}>Refresh</div>
      </div>
    </div>
  `
}
