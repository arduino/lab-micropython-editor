class CodeMirrorEditor extends Component {
  constructor() {
    super()
    this.editor = null
    this.content = '# empty file'
  }

  load(el) {
    console.log('cm load')
    const onCodeChange = (update) => {
      this.content = update.state.doc.toString()
      console.log('code change', this.content)
    }
    this.editor = createEditor(this.content, el, onCodeChange)

  }

  createElement(content) {
    console.log('cm create')
    if (content) this.content = content
    return html`<div class="code-editor"></div>`
  }

  update() {
    console.log('cm update')
    return false
  }

  codeChange() { return }
}
