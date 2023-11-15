function FileManagerView(state, emit) {
  return html`
    <div id="app">
      <div class="working-area">
        ${Toolbar(state, emit)}
        <div id="file-manager">
          <div id="board-files">
            <div class="device-header">
              <img class="icon" src="media/${state.isConnected?'connect':'disconnect'}.svg" />
              <div onclick=${() => emit('open-connection-dialog')} class="text">${state.isConnected?state.connectedPort:'Select a board...'}</div>
              <button disabled=${!state.isConnected}>
                <img class="icon" src="media/new-file.svg" />
              </button>
            </div>
            ${BoardFileList(state, emit)}
          </div>
          ${FileActions(state, emit)}
          <div id="local-files">
            <div class="device-header">
              <img class="icon" src="media/computer.svg" />
              <div class="text" onclick=${() => emit('select-disk-navigation-root')}>
                ${state.diskNavigationRoot}
              </div>
              <button>
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



// <div>

// </div>
