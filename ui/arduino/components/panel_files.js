function PanelFiles(state, emit) {
  function ListItem(device, file) {
    let selectedClass = ''
    if (device === state.selectedDevice && file === state.selectedFile) {
      selectedClass = 'selected'
    }
    return html`
      <li
        onclick=${() => emit('select-file', device, file)}
        class=${selectedClass}
        >
        ${file}
      </li>
    `
  }

  let upload = Button({
    label: 'upload',
    icon: 'icons/left.png',
    disabled: !state.isConnected || state.selectedDevice !== 'disk' || state.selectedFile === null
  })
  let download = Button({
    label: 'download',
    icon: 'icons/right.png',
    disabled: !state.isConnected || state.selectedDevice !== 'serial' || state.selectedFile === null
  })
  let remove = Button({
    label: 'remove',
    icon: 'icons/delete.png',
    disabled: state.selectedFile === null
  })

  return html`
    <div id="files">
      <div class="file-list">
        <span class="path">Serial: ${state.serialPath}</span>
        <ul>
          ${state.serialFiles.map((file) => ListItem('serial', file))}
        </ul>
      </div>
      <div class="file-controls">
        ${upload}
        ${download}
        ${remove}
      </div>
      <div class="file-list">
        <span class="path">Disk: ${state.diskFolder}</span>
        <ul>
          ${state.diskFiles.map((file) => ListItem('disk', file))}
        </ul>
      </div>
    </div>
  `
}
