function FileName(state, emit) {
  // File icon: disk or board
  let fileIcon = 'icons/Open.svg'
  if (state.isConnected && state.selectedDevice === 'serial') {
    fileIcon = 'icons/Connect.svg'
  }
  // Filename input
  function onBlur(e) {
    emit('save-filename', e.target.value)
  }
  function onKeyDown(e) {
    if(e.key.toLowerCase() === 'enter') {
      e.target.blur()
    }
  }
  /*
  XXX: If this input is blurred because person clicked on another serial file,
  it triggers both a `save-filename` and a `select-file` event and
  filesystem panel will act up. It will require only re-opening it.
  */
  let filename = html`
    <input
      type="text"
      value=${state.selectedFile || 'undefined'}
      onblur=${onBlur}
      onkeydown=${onKeyDown}
      />
  `
  return html`
    <div class="editor-filename">
      ${Icon(fileIcon)}
      ${filename}
    </div>
  `
}
