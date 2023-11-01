function CodeEditor(state, emit) {
  if (state.editingFile) {
    const file = state.diskFiles.find(f => f.id == state.editingFile)
    return file.editor.render(file.content)
  } else {
    return html`
      <div class="code-editor"></div>
    `
  }
}
