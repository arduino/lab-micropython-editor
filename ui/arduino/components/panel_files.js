function PanelFiles(state, emit) {
  function ListItem(device, file) {
    let selectedClass = ''
    if (device === state.selectedDevice && file.path === state.selectedFile) {
      selectedClass = 'selected'
    }
    function onClick() {
      if (file.type === 'folder') {
        emit('navigate-to', device, file.path)
      } else {
        emit('select-file', device, file.path)
      }
    }
    return html`
      <li
        onclick=${onClick}
        class=${selectedClass}
        >
        ${file.type === 'folder' ? '📁' : '📄'}
        ${file.path}
      </li>
    `
  }

  let uploadEnabled = state.isConnected
                    && state.diskPath
                    && state.selectedDevice === 'disk'
                    && state.selectedFile !== null
  let downloadEnabled = state.isConnected
                    && state.diskPath
                    && state.selectedDevice === 'serial'
                    && state.selectedFile !== null
  let canRemoveSerial = state.isConnected
                    && state.selectedDevice === 'serial'
                    && state.selectedFile !== null
  let canRemoveDisk = state.selectedDevice === 'disk'
                    && state.selectedFile !== null

  let upload = Button({
    icon: 'icons/Copy-Left.svg',
    onclick: () => emit('upload'),
    disabled: !uploadEnabled
  })
  let download = Button({
    icon: 'icons/Copy-Right.svg',
    onclick: () => emit('download'),
    disabled: !downloadEnabled
  })
  let refresh = Button({
    icon: 'icons/Reboot.svg',
    onclick: () => emit('update-files'),
    disabled: !(state.isConnected || state.diskPath)
  })

  let removeSerial = Button({
    icon: 'icons/Delete.svg',
    onclick: () => emit('remove'),
    disabled: !canRemoveSerial
  })
  let newSerial = Button({
    icon: 'icons/New.svg',
    onclick: () => emit('new-file', 'serial'),
    disabled: !state.isConnected
  })

  let removeDisk = Button({
    icon: 'icons/Delete.svg',
    onclick: () => emit('remove'),
    disabled: !canRemoveDisk
  })
  let newDisk = Button({
    icon: 'icons/New.svg',
    onclick: () => emit('new-file', 'disk'),
    disabled: !state.diskPath
  })

  return html`
    <div id="files">
      <div class="file-list">
        <div class="path">
          <a class="full" href="#" onclick=${() => emit('open-port-dialog')}>
            <span>${state.isConnected ? Icon('icons/Connect.svg') : Icon('icons/Disconnect.svg')}</span>
            <span>${state.isConnected ? state.serialPath : 'Connect'}</span>
          </a>
          ${removeSerial}
          ${newSerial}
        </div>
        <ul>
          <li onclick=${() => emit('navigate-to-parent', 'serial')}>
            ..
          </li>
          ${state.serialFiles.map((file) => ListItem('serial', file))}
        </ul>
      </div>
      <div class="file-controls">
        ${upload}
        ${download}
        ${refresh}
      </div>
      <div class="file-list">
        <div class="path">
          <a class="full" href="#" onclick=${() => emit('open-folder')}>
            <span>${Icon('icons/Open.svg')}</span>
            <span>${state.diskPath ? state.diskPath : 'Select Folder'}</span>
          </a>
          ${removeDisk}
          ${newDisk}
        </div>
        <ul>
          <li onclick=${() => emit('navigate-to-parent', 'disk')}>
            ..
          </li>
          ${state.diskFiles.map((file) => ListItem('disk', file))}
        </ul>
      </div>
    </div>
  `
}
