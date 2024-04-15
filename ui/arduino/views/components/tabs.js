function Tabs(state, emit) {
  const tabs = html`
    <div id="tabs">
      ${state.openFiles.map((file) => {
        return Tab({
          text: file.fileName,
          icon: file.source === 'board'? 'connect.svg': 'computer.svg',
          active: file.id === state.editingFile,
          renaming: file.id === state.renamingTab,
          hasChanges: file.hasChanges,
          onSelectTab: () => emit('select-tab', file.id),
          onCloseTab: () => emit('close-tab', file.id),
          onStartRenaming: () => emit('rename-tab', file.id),
          onFinishRenaming: (value) => emit('finish-renaming-tab', value)
        })
      })}
    </div>
  `
  // Mutation observer
  const observer = new MutationObserver((mutations) => {
    const el = tabs.querySelector('input')
    if (el) {
      el.focus()
    }
  })
  observer.observe(tabs, { childList: true, subtree:true })

  return tabs
}
