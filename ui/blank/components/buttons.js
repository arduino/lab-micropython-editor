function Button(props, children) {
  const { className = '', onclick = () => false, disabled = false } = props
  return html`<button
      class="${className}"
      onclick=${onclick}
      disabled=${disabled}
      >
      ${children}
    </button>
    `
}

function RoundButton(props, children) {
  props.className += ' round'
  return Button(props, children)
}

function SquareButton(props, children) {
  props.className += ' square'
  return Button(props, children)
}

function TinyButton(props, children) {
  props.className += ' tiny'
  return Button(props, children)
}
