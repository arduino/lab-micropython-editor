import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {python} from "@codemirror/lang-python"
import {indentWithTab, defaultKeymap} from "@codemirror/commands"

window.createEditor = (doc, el) => new EditorView({
  doc: doc || '',
  extensions: [
    basicSetup,
    keymap.of([indentWithTab]),
    keymap.of([defaultKeymap]),
    python()
  ],
  parent: el
})
