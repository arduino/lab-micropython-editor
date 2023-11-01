function CodeEditor(state, emit) {
  if (state.editingFile) {
    const file = state.diskFiles.find(f => f.id == state.editingFile)
    return file.editor.render()
  } else {
    return html`
      <div id="code-editor"></div>
    `
  }
}
