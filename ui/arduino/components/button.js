function Button(param) {
  let {
    onclick = () => false,
    disabled = false,
    label = '',
    icon = '',
    color = 'default',
    selected = false
  } = param || {}
  return html`
    <div
      class="toolbar-button-wrapper ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}"
      onclick=${onclick}
      >
      <button
        class="toolbar-button"
        disabled=${disabled}
        >
        ${Icon(icon)}
      </button>
      <span class="toolbar-label">${label}</span>
    </div>
  `
}
