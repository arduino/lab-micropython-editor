function ConnectionDialog(state, emit) {
  const stateClass = state.dialogs['connection'] ? 'open' : 'closed'
  function onClick(e) {
    if (e.target.id == 'dialog') {
      emit('close-dialog')
    }
  }

  return html`
    <div id="dialog" class="${stateClass}" onclick=${onClick}>
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
