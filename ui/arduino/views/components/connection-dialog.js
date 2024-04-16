function ConnectionDialog(state, emit) {
  const stateClass = state.isConnectionDialogOpen ? 'open' : 'closed'
  function onClick(e) {
    if (e.target.id == 'dialog') {
      emit('close-connection-dialog')
    }
  }

  return html`
    <div id="dialog" class="${stateClass}" onclick=${onClick}>
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
