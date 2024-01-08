function DiskFileList(state, emit) {

  function DiskFileItem(item, i) {
    if (item.type === 'folder') {
      return html`
        <div class="item" onclick=${() => emit('navigate-disk-folder', item.fileName)}>
          <img class="icon" src="media/folder.svg" />
          <div class="text">${item.fileName}</div>
        </div>
      `
    } else {
      const isChecked = state.selectedFiles.find(f => f.fileName === item.fileName && f.source === 'disk')
      return html`
        <div class="item">
          ${Checkbox({
            checked: isChecked,
            icon: 'file.svg',
            onClick: () => emit('toggle-file-selection', item, 'disk')
          })}
          <div onclick=${() => emit('toggle-file-selection', item, 'disk')} class="text">${item.fileName}</div>
          <div class="options" onclick=${() => console.log('options', item)}>
            <img src="media/falafel.svg" />
          </div>
        </div>
      `
    }
  }
  function onEnterKey(e) {
    if(e.key.toLowerCase() === 'enter') {
      e.target.blur()
    }
  }
  const newFileItem = html`
  <div class="item">
    <img class="icon" src="media/file.svg" />
    <div class="text">
      <input autofocus
      type="text"
      onkeydown=${onEnterKey}
      onblur=${(e) => emit('finish-creating', e.target.value)}
      />
      <script>
        document.currentScript.parentNode.querySelector('input').focus()
      </script>
    </div>
  </div>
`

  return html`
    <div class="file-list">
      <div class="list">
        <div class="item" onclick=${() => emit('navigate-disk-parent')}>..</div>
        ${state.creatingFile == 'disk' ? newFileItem : null}
        ${state.diskFiles.map(DiskFileItem)}
        
    </div>
  `
}

function BoardFileList(state, emit) {

  function BoardFileItem(item, i) {
    if (item.type === 'folder') {
      return html`
        <div class="item" onclick=${() => emit('navigate-board-folder', item.fileName)}>
          <img class="icon" src="media/folder.svg" />
          <div class="text">${item.fileName}</div>
        </div>
      `
    } else {
      const isChecked = state.selectedFiles.find(f => f.fileName === item.fileName && f.source === 'board')
      return html`
        <div class="item">
          ${Checkbox({
            checked: isChecked,
            icon: 'file.svg',
            onClick: () => emit('toggle-file-selection', item, 'board')
          })}
          <div onclick=${() => emit('toggle-file-selection', item, 'board')} class="text">${item.fileName}</div>
          <div class="options" onclick=${() => console.log('options', item)}>
            <img src="media/falafel.svg" />
          </div>
        </div>
      `
    }
  }

  function onEnterKey(e) {
    if(e.key.toLowerCase() === 'enter') {
      e.target.blur()
    }
  }

  const newFileItem = html`
  <div class="item">
    <img class="icon" src="media/file.svg" />
    <div class="text">
      <input autofocus
      type="text"
      onkeydown=${onEnterKey}
      onblur=${(e) => emit('finish-creating', e.target.value)}
      />
      <script>
        document.currentScript.parentNode.querySelector('input').focus()
      </script>
    </div>
  </div>
`

  return html`
    <div class="file-list">
      <div class="list">
        <div class="item" onclick=${() => emit('navigate-board-parent')}>..</div>
        ${state.creatingFile == 'serial' ? newFileItem : null}
        ${state.boardFiles.map(BoardFileItem)}
        
    </div>
  `
}
