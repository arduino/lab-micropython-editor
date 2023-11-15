function DiskFileList(state, emit) {

  function DiskFileItem(item, i) {
    if (item.type === 'folder') {
      return html`
        <div class="item" onclick=${() => console.log(item)}>
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

  return html`
  <div class="file-list">
    <div class="list">
      <div class="item">..</div>
      ${state.diskFiles.map(DiskFileItem)}
  </div>
  `
}

function BoardFileList(state, emit) {

  function BoardFileItem(item, i) {
    if (item.type === 'folder') {
      return html`
        <div class="item" onclick=${() => console.log(item)}>
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

  return html`
  <div class="file-list">
    <div class="list">
      <div class="item">..</div>
      ${state.boardFiles.map(BoardFileItem)}
  </div>
  `
}
