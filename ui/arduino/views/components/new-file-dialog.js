function NewFileDialog(state, emit) {
  const stateClass = state.isNewFileDialogOpen ? 'open' : 'closed'
  function clickDismiss(e) {
    if (e.target.id == 'dialog-new-file') {
      emit('close-new-file-dialog')
    }
  }
  
  function triggerTabCreation(device) {
    return () => {
      const input = document.querySelector('#file-name')
      const fileName = input.value.trim() || input.placeholder
      emit('create-new-tab', device, fileName)
    }
  }

  let boardOption = ''
  let inputFocus = ''
  if (state.isConnected) {
    boardOption = html`
      <div class="item" onclick=${triggerTabCreation('board')}>Board</div>
    `
  }
   
  const newFileDialogObserver = new MutationObserver((mutations, obs) => {
    const input = document.querySelector('#dialog-new-file input')
    if (input) {
      input.focus()
      obs.disconnect()
    }
  })

  newFileDialogObserver.observe(document.body, { 
    childList: true,
    subtree: true
  })

  

  let inputFieldValue = ``
  let inputFieldPlaceholder = ``
  
  inputFieldPlaceholder = generateFileName()
  
  const inputAttrs = {
    type: 'text',
    id: 'file-name',
    value: inputFieldValue,
    placeholder: inputFieldPlaceholder
  }
  
  const randomFileName = generateFileName()
  const placeholderAttr = state.newFileName === null ? `placeholder="${randomFileName}"` : ''
  const newFileDialog = html`
  <div id="dialog-new-file" class="dialog ${stateClass}" onclick=${clickDismiss}>
    <div class="dialog-content">
      <div class="dialog-title">Create new file</div>
      <input ${inputAttrs} />
      <div class="buttons-horizontal">
        ${boardOption}
        <div class="item" onclick=${triggerTabCreation('disk')}>Computer</div>
      </div>
    </div>
  </div>
` 
  
  if (state.isNewFileDialogOpen) {
    const el = newFileDialog.querySelector('#dialog-new-file .dialog-contents > input')
    if (el) {
      el.focus()
    }
    return newFileDialog
  }


}
