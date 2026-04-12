function FileManagerView(state, emit) {
  const { isConnected, selectedFiles } = state

  const boardSelected = selectedFiles.filter(f => f.source === 'board')
  const diskSelected  = selectedFiles.filter(f => f.source === 'disk')

  let boardFullPath = 'Connect to board'
  let diskFullPath = `${state.diskNavigationRoot}${state.diskNavigationPath}`

  if (isConnected) {
    boardFullPath = `${state.connectedPort}${state.boardNavigationPath}`
  }

  function DeviceHeader({ source, fullPath, pathAction, icon }) {
    const sourceSelected = source === 'board' ? boardSelected : diskSelected
    const selectionActive = sourceSelected.length > 0

    const allowTransfer = source === 'board'
      ? canDownload({ isConnected, selectedFiles })
      : canUpload({ isConnected, selectedFiles })
    const allowOpen   = canEdit({ selectedFiles: sourceSelected })
    const allowRename = sourceSelected.length === 1
    const allowDelete = sourceSelected.length > 0

    const transferIcon = source === 'board' ? 'download.svg' : 'upload.svg'

    const defaultButtons = html`
      <button disabled=${source === 'board' && !isConnected} onclick=${() => emit('create-folder', source)}>
        <img class="icon" src="media/new-folder.svg" />
      </button>
      <button disabled=${source === 'board' && !isConnected} onclick=${() => emit('create-file', source)}>
        <img class="icon" src="media/new-file.svg" />
      </button>
    `

    const selectionButtons = html`
      <button disabled=${!allowTransfer} onclick=${() => emit(source === 'board' ? 'download-files' : 'upload-files')} title="${source === 'board' ? 'Download to computer' : 'Upload to board'}">
        <img class="icon" src="media/${transferIcon}" />
      </button>
      <button disabled=${!allowOpen} onclick=${() => emit('open-selected-files')} title="Open">
        <img class="icon" src="media/open.svg" />
      </button>
      <button disabled=${!allowRename} onclick=${() => emit('rename-file', source, sourceSelected[0])} title="Rename">
        <img class="icon" src="media/rename_v2.svg" />
      </button>
      <button disabled=${!allowDelete} onclick=${() => emit('remove-files')} title="Delete">
        <img class="icon" src="media/delete.svg" />
      </button>
      <button class="header-checkbox" onclick=${() => emit('clear-selection-by-source', source)} title="Deselect all">
        <img class="icon" src="media/clear-checked.svg" />
      </button>
    `

    return html`
      <div class="device-header ${selectionActive ? 'selection-active' : ''}">
        <img class="icon" src="media/${icon}" />
        <div class="text" onclick=${pathAction}>
          <span>${fullPath}</span>
        </div>
        ${selectionActive ? selectionButtons : defaultButtons}
      </div>
    `
  }

  return html`
    <div class="working-area">
      ${Toolbar(state, emit)}
      <div id="file-manager">
        <div id="board-files">
          ${DeviceHeader({
            source: 'board',
            fullPath: boardFullPath,
            pathAction: () => emit('connect'),
            icon: isConnected ? 'board.svg' : 'disconnect.svg'
          })}
          ${BoardFileList(state, emit)}
        </div>
        <div id="disk-files">
          ${DeviceHeader({
            source: 'disk',
            fullPath: diskFullPath,
            pathAction: () => emit('select-disk-navigation-root'),
            icon: 'computer.svg'
          })}
          ${DiskFileList(state, emit)}
        </div>
      </div>
    </div>
  `
}
