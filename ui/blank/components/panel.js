function Panel(state, emit) {
  let isTerminalSelected = (state.panel === 'terminal') && !state.panelCollapsed
  let isFilesSelected = (state.panel === 'files') && !state.panelCollapsed

  // Dragging to resize:
  let panelHeight = state.panelCollapsed ? 0 : state.panelHeight
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

  if (state.panelCollapsed) {
    return html`
      <div id="bar" class="color-0 row align-center justify-end">
        <span>${state.status}</span>
      </div>
    `
  } else {
    return html`
      <div
        id="bar"
        class="color-0 row align-center justify-end resizable"
        onmousedown=${onMouseDown}
        >
        <span>${state.status}</span>
      </div>
      <div
        id="panel"
        class="column fill"
        style="height: ${panelHeight}px"
        >
        ${isTerminalSelected ? state.cache(XTerm, 'terminal').render() : null}
        ${isFilesSelected ? FileBrowser(state, emit) : null}
      </div>
    `
  }
}
