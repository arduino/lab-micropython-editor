class CodeMirrorEditor extends Component {
  constructor() {
    super()
    this.editor = null
    this.content = '# empty file'
  }

  load(el) {
    const onCodeChange = (update) => {
      // console.log('code change', this.content)
      this.content = update.state.doc.toString()
      this.onChange()
    }
    this.editor = createEditor(this.content, el, onCodeChange)
  }

  createElement(content) {
    if (content) this.content = content
    return html`<div id="code-editor"></div>`
  }

  update() {
    return false
  }

  onChange() {
    return false
  }
}
