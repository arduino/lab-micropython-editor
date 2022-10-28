function NewFileDialog(state, emit) {
  if (!state.isNewFileDialogOpen) return null
  function PortItem(port) {
    return html`<li onclick=${() => emit('connect', port.path)}>${port.path}</li>`
  }
  function closeBackdrop(e) {
    if (e.target.id == 'backdrop') {
      emit('close-new-file-dialog')
    }
  }
  let serialOption = html`
    <li onclick=${() => emit('new-file', 'serial')}>MicroPython Board</li>
  `
  return html`
    <div id="backdrop" onclick=${closeBackdrop}>
      <div id="dialog">
        <ul>
          ${state.isConnected ? serialOption : null}
          <li onclick=${() => emit('new-file', 'disk')}>Computer Storage</li>
        </ul>
      </div>
    </div>
  `
}
