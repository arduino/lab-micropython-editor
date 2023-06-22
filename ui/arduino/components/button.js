function Button(param) {
  let {
    onclick = () => false,
    disabled = false,
    label = '',
    icon = '',
    className = '',
    selected = false
  } = param || {}
  return html`
    <div
      class="button-wrapper ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}"
      onclick=${onclick}
      >
      <button
        class="button ${className}"
        disabled=${disabled}
        >
        ${Icon(icon)}
      </button>
      <span class="toolbar-label">${label}</span>
    </div>
  `
}
