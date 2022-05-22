function Panel(state, emit) {
  let isTerminalSelected = (state.panel === 'terminal') && !state.panelCollapsed
  let isFilesSelected = (state.panel === 'files') && !state.panelCollapsed

  // Dragging event handlers
  function onMouseDown(e) {
    if (e.target.id !== 'bar') return
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp, { once: true })
  }
  function onMouseMove(e) {
    emit('resize-panel', e.clientY)
  }
  function onMouseUp(e) {
    window.removeEventListener('mousemove', onMouseMove)
  }

  // Panel selection handlers
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

  // Bar buttons
  let fileButton = SquareButton(
    { onclick: selectFiles, className: isFilesSelected ? 'active' : 'inactive'},
    Image({ src: 'icons/folder.png' })
  )
  let terminalButton = SquareButton(
    { onclick: selectTerminal , className: isTerminalSelected ? 'active' : 'inactive' },
    Image( { src: 'icons/developer_board.png' } )
  )

  let panelHeight = state.panelCollapsed ? 0 : state.panelHeight
  let background = isTerminalSelected ? 'black' : 'gray'

  if (state.panelCollapsed) {
    return html`
      <div id="bar" class="gray row align-center justify-end">
        ${fileButton}
        ${terminalButton}
      </div>
    `
  } else {
    return html`
      <div
        id="bar"
        class="gray row align-center justify-end resizable"
        onmousedown=${onMouseDown}
        >
        ${fileButton}
        ${terminalButton}
      </div>
      <div
        id="panel" 
        class="${background} column fill"
        style="height: ${panelHeight}px"
        >
        ${isTerminalSelected ? state.cache(XTerm, 'terminal').render() : null}
        ${isFilesSelected ? FileBrowser(state, emit) : null}
      </div>
    `
  }
}
