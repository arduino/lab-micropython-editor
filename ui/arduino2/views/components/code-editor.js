class CodeMirrorEditor extends Component {
  constructor() {
    super()
    this.editor = null
    this.content = ''
  }

  load(el) {
    this.editor = createEditor(this.content, el)
  }

  createElement(content) {
    this.content = content
    return html`<div class="code-editor"></div>`
  }

  update() {
    return false
  }

  codeChange() { return }
}

function CodeEditor(state, emit) {
  const el = state.cache(CodeMirrorEditor, 'editor')
  el.codeChange = () => emit('code-change')
  setTimeout(() => {
    el.render('ra')
  }, 500)
  return html`${el.render(defaultCode)}`
}

const defaultCode = `from alvik import *

def setup():
    pass

def loop():
    pass

start(setup=setup, loop=loop)

`
