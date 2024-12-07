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
      function navigateToFolder() {
        if (!state.renamingFile) emit(`navigate-${source}-folder`, item.fileName)
      }
      function openFile() {
        if (!state.renamingFile) emit(`open-file`, source, item)
      }
      let fileName = item.fileName
      const isSelected = state.selectedFiles.find(f => f.fileName === fileName)

      if (state.renamingFile == source && isSelected) {
        fileName = renamingFileItem
      }
      if (item.type === 'folder') {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''}"
            onclick=${(e) => emit('toggle-file-selection', item, source, e)}
            ondblclick=${navigateToFolder}
            >
            <img class="icon" src="media/folder.svg" />
            <div class="text">${fileName}</div>
            <div class="options" onclick=${renameItem}>
              <img src="media/cursor.svg" />
            </div>
          </div>
        `
      } else {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''}"
            onclick=${(e) => emit('toggle-file-selection', item, source, e)}
            ondblclick=${openFile}
            >
            <img class="icon" src="media/file.svg"  />
            <div class="text">${fileName}</div>
            <div class="options" onclick=${renameItem}>
              <img src="media/cursor.svg" />
            </div>
          </div>
        `
      }
    }

    // XXX: Use `source` to filter an array of files with a `source` as proprety
    const files = state[`${source}Files`].sort((a, b) => {
      const nameA = a.fileName.toUpperCase()
      const nameB = b.fileName.toUpperCase()
      // Folders come first than files
      if (a.type === 'folder' && b.type === 'file') return -1
      // Folders and files come in alphabetic order
      if (a.type === b.type) {
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
      }
      return 0
    })
    const parentNavigationDots = html`<div class="item"
  onclick=${() => emit(`navigate-${source}-parent`)}
  style="cursor: pointer"
  >
  ..
</div>`

    const list = html`
      <div class="file-list">
        <div class="list">
          ${source === 'disk' && state.diskNavigationPath != '/' ? parentNavigationDots : ''}
          ${source === 'board' && state.boardNavigationPath != '/' ? parentNavigationDots : ''}
          ${state.creatingFile == source ? newFileItem : null}
          ${state.creatingFolder == source ? newFolderItem : null}
          ${files.map(FileItem)}
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
}
