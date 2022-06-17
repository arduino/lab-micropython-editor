function Toolbar(state, emit) {
  const isTerminalSelected = (state.panel === 'terminal') && !state.panelCollapsed
  const isFilesSelected = (state.panel === 'files') && !state.panelCollapsed
  const canSave = (state.selectedDevice === 'board' && state.connected)
               || (state.selectedDevice === 'disk' && state.diskFolder)

  // Toolbar actions:
  function togglePanel() {
    emit('toggle-panel')
  }
  function selectFiles() {
    if (state.panel === 'files') {
      emit('toggle-panel')
    } else {
      if (state.panelCollapsed) {
        emit('toggle-panel')
      }
      emit('select-panel', 'files')
    }
  }
  function selectTerminal() {
    if (state.panel === 'terminal') {
      emit('toggle-panel')
    } else {
      if (state.panelCollapsed) {
        emit('toggle-panel')
      }
      emit('select-panel', 'terminal')
    }
  }

  // Buttons
  const runButton = RoundButton(
    {
      onclick: () => emit('run'),
      disabled: !state.connected,
      className: 'color-3'
    },
    Image({src: 'icons/play_arrow.png'})
  )
  const stopButton = RoundButton(
    {
      onclick: () => emit('stop'),
      disabled: !state.connected,
      className: 'color-3'
    },
    Image({src: 'icons/stop.png'})
  )
  const resetButton = RoundButton(
    {
      onclick: () => emit('reset'),
      disabled: !state.connected,
      className: 'color-3'
    },
    Image({src: 'icons/reset.png'})
  )
  const connectButton = RoundButton(
    {
      onclick: () => emit('open-port-dialog'),
      className: 'color-3'
    },
    Image({src: 'icons/cable.png'})
  )
  const newButton = RoundButton(
    {
      onclick: () => emit('new-file'),
      className: 'white'
    },
    Image({src: 'icons/add.png'})
  )
  const openFolderButton = RoundButton(
    {
      onclick: () => emit('open-disk-folder'),
      className: 'white'
    },
    Image({src: 'icons/folder.png'})
  )
  const saveButton = RoundButton(
    {
      onclick: () => emit('save-file'),
      disabled: !canSave,
      className: 'white'
    },
    Image({ src: 'icons/sd_storage.png' })
  )
  const fileButton = RoundButton(
    {
      onclick: selectFiles,
      className: isFilesSelected ? 'active' : 'inactive'
    },
    Image({ src: 'icons/screen_search.png' })
  )
  const terminalButton = RoundButton(
    {
      onclick: selectTerminal ,
      className: isTerminalSelected ? 'active' : 'inactive'
    },
    Image( { src: 'icons/code.png' } )
  )

  return html`
    <div id="toolbar" class="row color-0">
      <div class="row">
        ${runButton}
        ${stopButton}
        ${resetButton}
      </div>
      <div class="row fill justify-start align-center">
        ${newButton}
        ${openFolderButton}
        ${saveButton}
        ${terminalButton}
        ${fileButton}
      </div>
      <div class="row">
        ${connectButton}
      </div>
    </div>
  `
}
