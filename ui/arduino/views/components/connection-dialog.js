function ConnectionDialog(state, emit) {
  const stateClass = state.isConnectionDialogOpen ? 'open' : 'closed'
  function clickDismiss(e) {
    if (e.target.id == 'dialog-connection') {
      emit('close-connection-dialog')
    }
  }

  const connectionDialog = html`
  <div id="dialog-connection" class="dialog ${stateClass}" onclick=${clickDismiss}>
    
    <div class="dialog-content">
    <div class="dialog-title">Connect to...</div>
      ${state.availablePorts.map(
        (port) => html`
          <div class="item" onclick=${() => emit('select-port', port)}>
            ${port.path}
          </div>
        `
      )}
      <div class="item" onclick=${() => emit('update-ports')}>Refresh</div>
      <!--div class="dialog-feedback">Select a board to connect to.</div-->
    </div>
    
  </div>
  `
  if (state.isConnectionDialogOpen) {
    return connectionDialog
  }
  
}
