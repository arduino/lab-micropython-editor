import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {python} from "@codemirror/lang-python"
import {indentWithTab, defaultKeymap} from "@codemirror/commands"

let updateListenerExtension = (onChange) => EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    onChange(update)
  }
});

window.createEditor = (doc, el, onChange) => new EditorView({
  doc: doc || '',
  extensions: [
    basicSetup,
    keymap.of([indentWithTab]),
    keymap.of([defaultKeymap]),
    python(),
    updateListenerExtension(onChange)
  ],
  parent: el
})
