function DiskFileList(state, emit) {
  
  function onKeyEvent(e) {
    if(e.key.toLowerCase() === 'enter') {
      e.target.blur()
    }
    if(e.key.toLowerCase() === 'escape') {
      e.target.value = null
      e.target.blur()
    }
  }

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

  const newFileItem = html`
    <div class="item">
      <img class="icon" src="media/file.svg" />
      <div class="text">
        <input type="text" onkeydown=${onKeyEvent} onblur=${(e) => emit('finish-creating', e.target.value)}/>
      </div>
    </div>
  `

  const list = html`
    <div class="file-list">
      <div class="list">
        <div class="item" onclick=${() => emit('navigate-disk-parent')}>..</div>
        ${state.creatingFile == 'disk' ? newFileItem : null}
        ${state.diskFiles.map(DiskFileItem)}
      </div>
    </div>
  `

  // Mutation observer
  const observer = new MutationObserver((mutations) => {
    const el = list.querySelector('input')
    if (el) {
      el.focus()
      observer.disconnect()
    }
  })
  observer.observe(list, { childList: true, subtree:true })

  return list
}

function BoardFileList(state, emit) {

  function onKeyEvent(e) {
    if(e.key.toLowerCase() === 'enter') {
      e.target.blur()
    }
    if(e.key.toLowerCase() === 'escape') {
      e.target.value = null
      e.target.blur()
    }
  }

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

  const newFileItem = html`
    <div class="item">
      <img class="icon" src="media/file.svg" />
      <div class="text">
        <input type="text" onkeydown=${onKeyEvent}  onblur=${(e) => emit('finish-creating', e.target.value)}/>
      </div>
    </div>
  `

  const list = html`
    <div class="file-list">
      <div class="list">
        <div class="item" onclick=${() => emit('navigate-board-parent')}>..</div>
        ${state.creatingFile == 'serial' ? newFileItem : null}
        ${state.boardFiles.map(BoardFileItem)}
      </div>
    </div>
  `
  // Mutation observer
  const observer = new MutationObserver((mutations) => {
    const el = list.querySelector('input')
    if (el) {
      el.focus()
      observer.disconnect()
    }
  })
  observer.observe(list, { childList: true, subtree:true })

  return list
}
