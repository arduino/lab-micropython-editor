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
  return html`${state.editor.render(defaultCode)}`
}

const defaultCode = `from alvik import *

def setup():
  print('Start:')

def loop():
  print('.', end='')
  sleep_ms(100)

start(setup=setup, loop=loop)

`
