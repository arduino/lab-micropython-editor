function FileBrowser(state, emit) {
  function BoardFile(file) {
    let selectedClass = ''
    if (state.selectedDevice === 'board' && state.selectedFile === file) {
      selectedClass = 'selected'
    }
    return html`
      <li
        class=${selectedClass}
        onclick=${() => emit('select-board-file', file)}
      >
        ${file}
      </li>
    `
  }
  function DiskFile(file) {
    let selectedClass = ''
    if (state.selectedDevice === 'disk' && state.selectedFile === file) {
      selectedClass = 'selected'
    }
    return html`
      <li
        class=${selectedClass}
        onclick=${() => emit('select-disk-file', file)}
      >
        ${file}
      </li>
    `
  }

  let canSendToBoard = state.selectedDevice === 'disk'
                    && state.connected === true
                    && state.selectedFile
                    && state.diskFolder
  let canSendToDisk = state.selectedDevice === 'board'
                    && state.connected === true
                    && state.selectedFile
                    && state.diskFolder

  let sendToBoardButton = SquareButton(
    {
      onclick: () => emit('send-file-to-board'),
      disabled: !canSendToBoard
    },
    Image({src: 'icons/left.png'})
  )
  let sendToDiskButton = SquareButton(
    {
      onclick: () => emit('send-file-to-disk'),
      disabled: !canSendToDisk
    },
    Image({src: 'icons/right.png'})
  )
  let removeButton = SquareButton(
    {
      onclick: () => emit('remove-file'),
      disabled: !state.selectedFile
    },
    Image({src: 'icons/delete.png'})
  )

  return html`
    <div id="files" class="row fill">
      <div id="board-files" class="fill">
        <ul id="file-list" class="fill white column">
          ${state.boardFiles.map(BoardFile)}
        </ul>
      </div>
      <div id="file-actions" class="column fill-vertical align-center">
        ${sendToBoardButton}
        ${sendToDiskButton}
        ${removeButton}
      </div>
      <div id="system-files" class="fill">
        <ul id="file-list" class="fill white column">
          ${state.diskFiles.map(DiskFile)}
        </ul>
      </div>
    </div>
  `
}
