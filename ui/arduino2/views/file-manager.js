function FileManagerView(state, emit) {
  let boardFullPath = 'Select a board...'
  let diskFullPath = `${state.diskNavigationRoot}${state.diskNavigationPath}`

  if (state.isConnected) {
    boardFullPath = `${state.connectedPort}${state.boardNavigationPath}`
  }

  return html`
    <div id="app">
      <div class="working-area">
        ${Toolbar(state, emit)}
        <div id="file-manager">
          <div id="board-files">
            <div class="device-header">
              <img class="icon" src="media/${state.isConnected?'connect':'disconnect'}.svg" />
              <div onclick=${() => emit('open-connection-dialog')} class="text">
                <span>${boardFullPath}</span>
              </div>
              <button disabled=${!state.isConnected} onclick=${() => emit('create-folder', 'board')}>
                <img class="icon" src="media/new-folder.svg" />
              </button>
              <button disabled=${!state.isConnected} onclick=${() => emit('create-file', 'board')}>
                <img class="icon" src="media/new-file.svg" />
              </button>
            </div>
            ${BoardFileList(state, emit)}
          </div>
          ${FileActions(state, emit)}
          <div id="disk-files">
            <div class="device-header">
              <img class="icon" src="media/computer.svg" />
              <div class="text" onclick=${() => emit('select-disk-navigation-root')}>
                <span>${diskFullPath}</span>
              </div>
              <button onclick=${() => emit('create-folder', 'disk')}>
                <img class="icon" src="media/new-folder.svg" />
              </button>
              <button onclick=${() => emit('create-file', 'disk')}>
                <img class="icon" src="media/new-file.svg" />
              </button>
            </div>
            ${DiskFileList(state, emit)}
          </div>
        </div>
      </div>
      ${ConnectionDialog(state, emit)}
    </div>
  `
}
