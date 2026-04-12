const DiskFileList = generateFileList('disk')
const BoardFileList = generateFileList('board')

function generateFileList(source) {
  return function FileList(state, emit) {
    function onKeyEvent(e) {
      if(e.key.toLowerCase() === 'enter') {
        e.target.blur()
      }
      if(e.key.toLowerCase() === 'escape') {
        e.target.value = null
        e.target.blur()
      }
    }

    const newFileItem = html`
      <div class="item">
        <img class="icon" src="media/file.svg" />
        <div class="text">
          <input type="text" onkeydown=${onKeyEvent} onblur=${(e) => emit('finish-creating-file', e.target.value)}/>
        </div>
      </div>
    `
    const newFolderItem = html`
      <div class="item">
        <img class="icon" src="media/folder.svg" />
        <div class="text">
          <input type="text" onkeydown=${onKeyEvent} onblur=${(e) => emit('finish-creating-folder', e.target.value)}/>
        </div>
      </div>
    `

    const selectionMode = state.selectedFiles.filter(f => f.source === source).length > 0

    function FileItem(item, i) {
      const renamingFileItem = html`
        <input type="text"
          value=${item.fileName}
          onkeydown=${onKeyEvent}
          onblur=${(e) => emit('finish-renaming-file', e.target.value)}
          onclick=${(e) => false}
          ondblclick=${(e) => false}
          />
      `
      const isChecked = state.selectedFiles.find(
        f => f.fileName === item.fileName && f.source === source
      )

      function renameItem(e) {
        e.preventDefault()
        emit('rename-file', source, item)
        return false
      }
      let clickTimer = null
      function handleClick(e) {
        clearTimeout(clickTimer)
        clickTimer = setTimeout(() => emit('toggle-file-selection', item, source, e), 250)
      }
      function navigateToFolder() {
        clearTimeout(clickTimer)
        if (!state.renamingFile) {
          emit(`navigate-${source}-folder`, item.fileName)
          requestAnimationFrame(() => {
            const el = document.querySelector(`#${source}-files .file-list`)
            if (el) el.scrollTop = 0
          })
        }
      }
      function openFile() {
        clearTimeout(clickTimer)
        if (!state.renamingFile) emit(`open-file`, source, item)
      }
      function checkboxToggle(e) {
        e.stopPropagation()
        // Always toggle (add/remove) without clearing other selections
        emit('toggle-file-selection', item, source, { ctrlKey: true })
      }

      let fileName = item.fileName
      const isSelected = state.selectedFiles.find(f => f.fileName === fileName && f.source === source)

      if (state.renamingFile == source && isSelected) {
        fileName = renamingFileItem
      }

      const checkbox = html`
        <div class="checkbox" onclick=${checkboxToggle}>
          <img src="media/${isChecked ? 'checked' : 'unchecked'}.svg" />
        </div>
      `

      if (item.type === 'folder') {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''}"
            onclick=${handleClick}
            ondblclick=${navigateToFolder}
            >
            <img class="icon" src="media/folder.svg" />
            <div class="text">${fileName}</div>
            ${selectionMode ? checkbox : ''}
          </div>
        `
      } else {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''}"
            onclick=${handleClick}
            ondblclick=${openFile}
            >
            <img class="icon" src="media/file.svg" />
            <div class="text">${fileName}</div>
            ${selectionMode ? checkbox : ''}
          </div>
        `
      }
    }

    const files = state[`${source}Files`].sort((a, b) => {
      const nameA = a.fileName.toUpperCase()
      const nameB = b.fileName.toUpperCase()
      if (a.type === 'folder' && b.type === 'file') return -1
      if (a.type === b.type) {
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
      }
      return 0
    })

    function navigateToParent() {
      emit(`navigate-${source}-parent`)
      requestAnimationFrame(() => {
        const el = document.querySelector(`#${source}-files .file-list`)
        if (el) el.scrollTop = 0
      })
    }

    const parentNavigationDots = html`
      <div class="item" onclick=${navigateToParent} style="cursor: pointer">
        ..
      </div>
    `

    const list = html`
      <div class="file-list ${selectionMode ? 'selection-mode' : ''}">
        <div class="list">
          ${source === 'disk' && state.diskNavigationPath != '/' ? parentNavigationDots : ''}
          ${source === 'board' && state.boardNavigationPath != '/' ? parentNavigationDots : ''}
          ${state.creatingFile == source ? newFileItem : null}
          ${state.creatingFolder == source ? newFolderItem : null}
          ${files.map(FileItem)}
        </div>
      </div>
    `

    const observer = new MutationObserver((mutations) => {
      const el = list.querySelector('input')
      if (el) {
        el.focus()
      }
    })
    observer.observe(list, { childList: true, subtree: true })

    return list
  }
}
