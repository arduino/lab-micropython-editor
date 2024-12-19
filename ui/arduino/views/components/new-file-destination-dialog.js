function NewFileDestinationDialog(state, emit) {
  const stateClass = state.isNewFileDialogOpen ? 'open' : 'closed'
  function onClick(e) {
    if (e.target.id == 'dialog-new-file') {
      emit('close-new-file-dialog')
    }
  }
  let boardOption = ''
  if (state.isConnected) {
    boardOption = html`
      <div class="item" onclick=${() => {emit('create-file','board', 'board_capocchia.py')}}>Board</div>
    `
  }
  const now = new Date();
  const dateStr = String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0')

  const fileName = `script_${dateStr}.py`;

  const newFileDialog = html`
  <div id="dialog-new-file" class="dialog ${stateClass}" onclick=${onClick}>
    <div class="dialog-content">
      <input type="text" id="file-name" placeholder="${generateFileName()}" autofocus />
      <div class="buttons-horizontal">
        ${boardOption}
        <div class="item" onclick=${() => {emit('create-file', 'disk', 'disk_capocchia.py')}}>Computer</div>
      </div>
    </div>
  </div>
`

  
  const observer = new MutationObserver((mutations, obs) => {
    const el = newFileDialog.querySelector('input')
    if (el) {
      el.focus()
      obs.disconnect()
    }
  })
  observer.observe(newFileDialog, { childList: true, subtree:true, attributes: true })
  
  return newFileDialog

  return html`
    <div id="dialog-new-file" class="dialog ${stateClass}" onclick=${onClick}>
      <div class="dialog-content">
        <input type="text" id="file-name" placeholder="${generateFileName()}" />
        <div class="buttons-horizontal">
          ${boardOption}
          <div class="item" onclick=${() => {emit('create-file', 'disk', 'disk_capocchia.py')}}>Computer</div>
        </div>
      </div>
    </div>
  `
  

}
