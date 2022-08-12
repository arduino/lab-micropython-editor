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
    <div class="toolbar-button-wrapper">
      <button
        class="toolbar-button ${color} ${selected ? 'selected' : ''}"
        onclick=${onclick}
        disabled=${disabled}
        >
        ${Icon(icon)}
      </button>
      <span class="toolbar-label">${label}</span>
    </div>
  `
}
