function PortDialog(state, emit) {
  function PortItem(port) {
    return html`<li onclick=${() => emit('connect', port)}>${port.path}</li>`
  }
  function closeBackdrop(e) {
    if (e.target.id == 'backdrop') {
      emit('close-port-dialog')
    }
  }
  return html`
    <div id="backdrop" onclick=${closeBackdrop}>
      <div id="dialog">
        <ul>
          ${state.ports.map(PortItem)}
          <li onclick=${() => window.serialBus.emit('load-ports')}>Refresh</li>
        </ul>
      </div>
    </div>
  `
}
