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
    selectedFiles = state.selectedFiles
    isConnected = state.isConnected

    console.log('generating', source, '| selectedFiles', selectedFiles)
    /*  template for new file item, with focussed input
        ESC to cancel, ENTER to finish */
    const newFileItem = html`
      <div class="item">
        <img class="icon" src="media/file.svg" />
        <div class="text">
          <input type="text" onkeydown=${onKeyEvent} onblur=${(e) => emit('finish-creating-file', e.target.value)}/>
        </div>
        <div class="popup-menu">
          <div class="popup-menu-item">rename</div>
          <div class="popup-menu-item">delete</div>
          <div class="popup-menu-item">upload</div>
        </div>
      </div>
    `
    /*  template for new folder item, with focussed input
        ESC to cancel, ENTER to finish */
    const newFolderItem = html`
      <div class="item">
        <img class="icon" src="media/folder.svg" />
        <div class="text">
          <input type="text" onkeydown=${onKeyEvent} onblur=${(e) => emit('finish-creating-folder', e.target.value)}/>
        </div>
        <div class="popup-menu">
          <div class="popup-menu-item">rename</div>
          <div class="popup-menu-item">delete</div>
          <div class="popup-menu-item">upload</div>
        </div>
      </div>
    `

    function dismissContextMenu(e, item) {
      console.log("click action", e, item)
      e.stopPropagation()
      state.itemActionMenu = null
      state.selectedFiles = []
      emit('render')
    }

    function triggerEdit() {
      emit('open-selected-files')
      state.itemActionMenu = null
      emit('render')
    }
    function triggerRemove() {
      emit('remove-files')
      state.itemActionMenu = null
      emit('render')
    }
    function triggerRename(item) {
      emit('rename-file', source, item)

      state.itemActionMenu = null
      emit('render')
    }
    function triggerTransfer() {
      if (source === 'disk') {
        emit('upload-files')
      }else{
        emit('download-files')
      }
      state.itemActionMenu = null
      emit('render')
    }
    // let allowTransfer = false
    // if (source === 'disk') {
    //   return canUpload(isConnected, selectedFiles)
    // else {
    //   return canDownload(isConnected, selectedFiles)
    // }
    const allowTransfer = source === 'disk' ? canUpload({isConnected, selectedFiles}) : canDownload({isConnected, selectedFiles})
    const allowEdit = canEdit({selectedFiles})
    const allowRename = selectedFiles.length === 1
    function ItemActions(item, i){
      const popupMenu = html`
        <div class="popup-menu">
          <div class="popup-menu-item ${allowEdit ? '' : 'disabled'}" onclick=${triggerEdit}><img src="media/pen.svg" /></div>
          <div class="popup-menu-item ${allowTransfer ? '' : 'disabled'}" onclick=${triggerTransfer}><img src="media/${source === 'disk' ? 'upload' : 'download'}.svg" /></div>
          <div class="popup-menu-item ${allowRename ? '' : 'disabled'}"" onclick=${() => triggerRename(item)}><img src="media/cursor.svg" /></div>
          <div class="popup-menu-item" onclick=${triggerRemove}><img src="media/delete.svg" /></div>
          <div class="popup-menu-item" onclick=${(e) => {dismissContextMenu(e, item)}}><img src="media/arrow-right-white.svg" /></div>
        </div>`
        return popupMenu
    }

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

      function toggleActionsMenu(item, source, e) {
        e.stopPropagation()
        console.log("show file options", item, source, e)
        emit('file-context-menu', item, source, e)
      }

      function checkboxToggle(item, source, e) {
        e.stopPropagation()
        emit('toggle-file-selection', item, source, e)
      }

      let fileName = item.fileName
      const isSelected = state.selectedFiles.find(f => f.fileName === fileName)

      if (state.renamingFile == source && isSelected) {
        fileName = renamingFileItem
      }

      // only show the action menu on current item
      const showActionMenu = state.itemActionMenu 
                          && state.itemActionMenu.fileName === item.fileName
                          && state.itemActionMenu.source === source
      
      const actionMenuHtml = showActionMenu ? html`${ItemActions(item, i)}` : html``
      
      if (item.type === 'folder') {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''} ${showActionMenu ? 'actionable' : ''}"
            onclick=${(e) => emit('toggle-file-selection', item, source, e)}
            ondblclick=${navigateToFolder}
            >
            <img class="icon" src="media/folder.svg" />
            <div class="text">${fileName}</div>
            <div class="options" onclick=${(e) => toggleActionsMenu(item, source, e)}>}>
              <img src="media/more.svg" />
            </div>
            <div class="checkbox" onclick=${(e) => checkboxToggle(item, source, e)}>}>
              <img src="media/unchecked.svg" />
            </div>
            ${actionMenuHtml}
          </div>
        `
      } else {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''} ${showActionMenu ? 'actionable' : ''}"
            onclick=${(e) => emit('toggle-file-selection', item, source, e)}
            ondblclick=${openFile}
            >
            <img class="icon" src="media/file.svg"  />
            <div class="text">${fileName}</div>
            <div class="options" onclick=${(e) => toggleActionsMenu(item, source, e)}>
              <img src="media/more.svg" />
            </div>
            <div class="checkbox" onclick=${(e) => checkboxToggle(item, source, e)}>}>
              <img src="media/unchecked.svg" />
            </div>
            ${actionMenuHtml}
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
          ${source == state.creatingFile ? newFileItem : null}
          ${source == state.creatingFolder ? newFolderItem : null}
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
