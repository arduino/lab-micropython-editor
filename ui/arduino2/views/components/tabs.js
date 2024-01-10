function Tabs(state, emit) {
  return html`
    <div id="tabs">
      ${state.openFiles.map((file) => {
        return Tab({
          text: file.fileName,
          icon: file.source === 'board'? 'connect.svg': 'computer.svg',
          active: file.id === state.editingFile,
          onSelectTab: () => emit('select-tab', file.id),
          onCloseTab: () => emit('close-tab', file.id)
        })
      })}
    </div>
  `
}
