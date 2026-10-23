import {
  EditorView, keymap, lineNumbers,
  highlightActiveLineGutter, highlightSpecialChars,
  drawSelection, dropCursor, crosshairCursor,
  rectangularSelection, highlightActiveLine
} from "@codemirror/view"
import { EditorState, EditorSelection, Compartment } from "@codemirror/state"
import {
  history, defaultKeymap, historyKeymap,
  indentMore, indentLess
} from "@codemirror/commands"
import {
  foldGutter, foldKeymap, bracketMatching,
  syntaxHighlighting, defaultHighlightStyle,
  indentOnInput, syntaxTree, indentUnit
} from "@codemirror/language"
import {
  autocompletion, completionKeymap, closeBrackets,
  closeBracketsKeymap, acceptCompletion, startCompletion, completionStatus
} from "@codemirror/autocomplete"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { lintKeymap } from "@codemirror/lint"
import { python } from "@codemirror/lang-python"
import { dracula } from "thememirror"

function selectLine(view, pos) {
  const line = view.state.doc.lineAt(pos)
  view.dispatch({
    selection: EditorSelection.range(line.from, line.to),
    userEvent: "select"
  })
  view.focus()
}

function selectEnclosingFunction(view, pos) {
  const tree = syntaxTree(view.state)
  let node = tree.resolveInner(pos, 1)
  while (node && node.name !== 'FunctionDefinition') {
    node = node.parent
  }
  if (node) {
    view.dispatch({
      selection: EditorSelection.range(node.from, node.to),
      userEvent: "select"
    })
  } else {
    selectLine(view, pos)
  }
  view.focus()
}

const selectFunction = (view) => {
  const pos = view.state.selection.main.head
  selectEnclosingFunction(view, pos)
  return true
}

const selectCurrentLine = (view) => {
  const pos = view.state.selection.main.head
  selectLine(view, pos)
  return true
}

window.editorCommands = {
  selectFunction,
  selectCurrentLine
}

const customLineNumbers = lineNumbers({
  domEventHandlers: {
    mousedown(view, line, event) {
      if (event.detail === 1) {
        const lineInfo = view.state.doc.lineAt(line.from)
        if (event.shiftKey) {
          const anchor = view.state.selection.main.anchor
          const target = anchor <= lineInfo.from
            ? EditorSelection.range(anchor, lineInfo.to)
            : EditorSelection.range(anchor, lineInfo.from)
          view.dispatch({ selection: target, userEvent: "select" })
        } else {
          const indent = lineInfo.text.match(/^\s*/)[0].length
          view.dispatch({
            selection: { anchor: lineInfo.from + indent },
            userEvent: "select"
          })
        }
        view.focus()
        return true
      }
      if (event.detail === 2) {
        selectLine(view, line.from)
        return true
      }
      if (event.detail >= 3) {
        selectEnclosingFunction(view, line.from)
        return true
      }
      return false
    }
  }
})

const customSetup = [
  customLineNumbers,
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
]

let updateListenerExtension = (onChange) => EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    onChange(update)
  }
})

function unescapeUnicode(str) {
  if (!str) return str;
  return str.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });
}

window.setEditorIndentUnit = (view, spaces) => {
  view.dispatch({ effects: view._indentCompartment.reconfigure(indentUnit.of(' '.repeat(spaces))) })
}

const _activeEditors = new Set()
window._activeEditors = _activeEditors

window.setEditorTheme = (view, isDark) => {
  view.dispatch({ effects: view._themeCompartment.reconfigure(isDark ? dracula : []) })
}

window.applyThemeToAllEditors = (isDark) => {
  for (const view of _activeEditors) {
    window.setEditorTheme(view, isDark)
  }
}

window.createEditor = (doc, el, onChange, indentSpaces = 4, isDark = false) => {
  const indentCompartment = new Compartment()
  const themeCompartment = new Compartment()
  const customTabKeymap = keymap.of([
    {
      key: "Tab",
      run: (view) => {
        if (completionStatus(view.state) === "active") {
          return acceptCompletion(view);
        }
        const { state } = view
        const { from, to, empty } = state.selection.main
        if (!empty) return indentMore(view)
        const line = state.doc.lineAt(from)
        const textBefore = line.text.slice(0, from - line.from)
        if (/^\s*$/.test(textBefore)) return indentMore(view)
        const unit = state.facet(indentUnit)
        view.dispatch(state.update({
          changes: { from, to, insert: unit },
          selection: { anchor: from + unit.length }
        }))
        return true
      }
    },
    {
      key: "Shift-Tab",
      run: indentLess
    },
    {
      key: "Ctrl-Space",
      run: startCompletion
    },
    {
      key: "Mod-Alt-l",
      run: selectCurrentLine
    },
    {
      key: "Mod-Alt-a",
      run: selectFunction
    }
  ]);
  const unescapedDoc = unescapeUnicode(doc || '');

  const view = new EditorView({
    doc: unescapedDoc,
    extensions: [
      customSetup,
      customTabKeymap,
      keymap.of([defaultKeymap]),
      python(),
      indentCompartment.of(indentUnit.of(' '.repeat(indentSpaces))),
      themeCompartment.of(isDark ? dracula : []),
      updateListenerExtension(onChange)
    ],
    parent: el
  });
  view._indentCompartment = indentCompartment
  view._themeCompartment = themeCompartment
  _activeEditors.add(view)
  return view
};
