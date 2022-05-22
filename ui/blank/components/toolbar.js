function Toolbar(state, emit) {
  const runButton = RoundButton(
    { onclick: () => emit('run'), disabled: !state.connected },
    Image({src: 'icons/play_arrow.png'})
  )
  const stopButton = RoundButton(
    { onclick: () => emit('stop'), disabled: !state.connected },
    Image({src: 'icons/stop.png'})
  )
  const resetButton = RoundButton(
    { onclick: () => emit('reset'), disabled: !state.connected },
    Image({src: 'icons/reset.png'})
  )
  const connectButton = RoundButton(
    { onclick: () => emit('open-port-dialog') },
    Image({src: 'icons/cable.png'})
  )

  const newButton = RoundButton(
    { onclick: () => emit('new-file') },
    Image({src: 'icons/add.png'})
  )
  const openFolderButton = RoundButton(
    { onclick: () => emit('open-disk-folder') },
    Image({src: 'icons/folder.png'})
  )
  const canSave = (state.selectedDevice === 'board' && state.connected)
               || (state.selectedDevice === 'disk' && state.diskFolder)
  const saveButton = RoundButton(
    { onclick: () => emit('save-file'), disabled: !canSave },
    Image({ src: 'icons/sd_storage.png' })
  )

  return html`
    <div id="toolbar" class="row gray">
      <div class="row">
        ${runButton}
        ${stopButton}
        ${resetButton}
      </div>
      <div class="row fill justify-start align-center">
        ${newButton}
        ${openFolderButton}
        ${saveButton}
      </div>
      <div class="row">
        ${connectButton}
      </div>
    </div>
  `
}
