class CodeMirrorEditor extends Component {
  constructor() {
    super()
    this.editor = null
    this.content = '# empty file'
    this.scrollTop = 0
  }

  load(el) {
    const onCodeChange = (update) => {
      this.content = update.state.doc.toString()
      this.onChange()
    }
    this.editor = createEditor(this.content, el, onCodeChange)
    this.editor.scrollDOM.addEventListener('scroll', this.updateScrollPosition.bind(this))
    setTimeout(() => {
      this.editor.scrollDOM.scrollTo({
        top: this.scrollTop,
        left: 0
      })
    }, 1)
  }

  updateScrollPosition(e) {
    console.log(e.target.scrollTop)
    this.scrollTop = e.target.scrollTop
  }

  unload() {
    this.editor.scrollDOM.removeEventListener('scroll', this.updateScrollPosition)
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
