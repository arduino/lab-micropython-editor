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
  return html`
    <div id="dialog-new-file" class="dialog ${stateClass}" onclick=${onClick}>
      <div class="dialog-content">
        ${boardOption}
        <div class="item" onclick=${() => {emit('create-file', 'disk', 'disk_capocchia.py')}}>Computer</div>
      </div>
    </div>
  `
}
