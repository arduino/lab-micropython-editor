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
    const isChecked = state.selectedFiles.find(
      f => f.fileName === item.fileName && f.source === 'disk'
    )
    if (item.type === 'folder') {
      return html`
        <div
          class="item ${isChecked ? 'selected' : ''}"
          ondblclick=${() => emit('navigate-disk-folder', item.fileName)}
          onclick=${() => emit('toggle-file-selection', item, 'disk')}
          >
          <img class="icon" src="media/folder.svg" />
          <div class="text">${item.fileName}</div>
        </div>
      `
    } else {
      return html`
        <div
          class="item ${isChecked ? 'selected' : ''}"
          onclick=${() => emit('toggle-file-selection', item, 'disk')}
          >
          <img class="icon" src="media/file.svg"  />
          <div class="text">${item.fileName}</div>
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
        <div class="item" ondblclick=${() => emit('navigate-disk-parent')}>..</div>
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
    const isChecked = state.selectedFiles.find(
      f => f.fileName === item.fileName && f.source === 'board'
    )
    if (item.type === 'folder') {
      return html`
        <div
          class="item ${isChecked ? 'selected' : ''}"
          onclick=${() => emit('toggle-file-selection', item, 'board')}
          ondblclick=${() => emit('navigate-board-folder', item.fileName)}
          >
          <img class="icon" src="media/folder.svg" />
          <div class="text">${item.fileName}</div>
        </div>
      `
    } else {
      return html`
        <div
          class="item ${isChecked ? 'selected' : ''}"
          onclick=${() => emit('toggle-file-selection', item, 'board')}
          >
          <img class="icon" src="media/file.svg" />
          <div class="text">${item.fileName}</div>
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
        <div class="item" ondblclick=${() => emit('navigate-board-parent')}>..</div>
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
    }
  })
  observer.observe(list, { childList: true, subtree:true })

  return list
}
