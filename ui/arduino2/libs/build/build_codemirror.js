import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {python} from "@codemirror/lang-python"
import {indentWithTab} from "@codemirror/commands"

window.createEditor = (doc, el) => new EditorView({
  doc: doc || '',
  extensions: [
    basicSetup,
    keymap.of([indentWithTab]),
    python()
  ],
  parent: el
})
