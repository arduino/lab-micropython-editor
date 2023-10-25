function CodeEditor(state, emit) {
  const el = html`<div class="code-editor"></div>`
  const editor = createEditor(el)
  return el
}
