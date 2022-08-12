function Toolbar(state, emit) {
  const connect = Button({
    icon: 'icons/cable.png',
    label: state.isConnected ? 'Disconnect' : 'Connect',
    disabled: false,
    onclick: () => emit('open-port-dialog'),
    color: state.isConnected ? 'selected' : 'default'
  })

  const play = Button({
    icon: 'icons/play_arrow.png',
    label: 'Run',
    disabled: !state.isConnected,
    onclick: () => emit('run'),
    color: 'primary'
  })
  const stop = Button({
    icon: 'icons/stop.png',
    label: 'Stop',
    disabled: !state.isConnected,
    onclick: () => emit('stop'),
    color: 'primary'
  })
  const reset = Button({
    icon: 'icons/reset.png',
    label: 'Reset',
    disabled: !state.isConnected,
    onclick: () => emit('reset'),
    color: 'primary'
  })

  const newFile = Button({
    icon: 'icons/add.png',
    label: 'New',
    disabled: false,
    onclick: () => emit('new-file')
  })
  const openFolder = Button({
    icon: 'icons/folder.png',
    label: 'Folder',
    disabled: true,
    onclick: () => emit('open-folder')
  })

  const canSave = (state.isConnected && state.selectedDevice === 'serial' && state.selectedFile)
               || (state.selectedDevice === 'disk' && state.selectedFile)
  const save = Button({
    icon: 'icons/sd_storage.png',
    label: 'Save',
    disabled: !canSave,
    onclick: () => emit('save')
  })

  const terminal = Button({
    icon: 'icons/code.png',
    label: 'Terminal',
    disabled: !state.isConnected,
    onclick: () => emit('show-terminal'),
    selected: state.isTerminalOpen,
  })
  const files = Button({
    icon: 'icons/screen_search.png',
    label: 'Files',
    disabled: false,
    onclick: () => emit('show-files'),
    selected: state.isFilesOpen
  })

  return html`
    <div id="toolbar">
      ${connect}
      ${play}
      ${stop}
      ${reset}
      ${newFile}
      ${openFolder}
      ${save}
      ${terminal}
      ${files}
    </div>
  `
}
