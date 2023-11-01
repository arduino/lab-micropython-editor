function Tabs(state, emit) {
  return html`
    <div class="tabs">
      ${state.openedFiles.map((id) => {
        const file = state.diskFiles.find(f => f.id === id)
        return Tab({
          text: file.path,
<<<<<<< Updated upstream
          icon: 'media/computer.svg',
=======
          icon: 'computer.svg',
>>>>>>> Stashed changes
          active: id === state.editingFile,
          onSelectTab: () => emit('select-tab', id),
          onCloseTab: () => emit('close-tab', id)
        })
      })}
      <div class="button">
        <button class="small">+</button>
      </div>
    </div>
  `
}
