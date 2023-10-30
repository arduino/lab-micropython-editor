function ConnectionDialog(state, emit) {
  const id = 'connection-dialog'
  const stateClass = state.dialogs['connection'] ? 'open' : 'closed'
  function onClick(e) {
    if (e.target.id == id) {
      emit('close-dialog')
    }
  }

  return html`
    <div id=${id} class="dialog ${stateClass}" onclick=${onClick}>
      <div class="dialog-content">
        ${state.availablePorts.map(
          (port) => html`
            <div class="item" onclick=${() => emit('connect', port)}>
              ${port.path}
            </div>
          `
        )}
        <div class="item" onclick=${() => emit('load-ports')}>Refresh</div>
      </div>
    </div>
  `
}
