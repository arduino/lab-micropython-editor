function Tab(args) {
  const {
    text = 'undefined',
    icon = 'computer.svg',
    onSelectTab = () => false,
    onCloseTab = () => false,
    disabled = false,
    active = false
  } = args

  let activeClass = active ? 'active' : ''
  let disabledClass = disabled ? 'disabled' : ''

  if (active) {
    return html`
      <div
        class="tab active"
        tabindex="0"
        >
        <img class="icon" src="media/${icon}" />
        <div class="text">${text}</div>
        <div class="options" tabindex="0" onclick=${onCloseTab}>
          <button>x</button>
        </div>
      </div>
    `
  }

  if (disabled) {
    return html`
      <div
        class="tab disabled"
        tabindex="0"
        >
        <img class="icon" src="media/${icon}" />
        <div class="text">${text}</div>
        <div class="options" tabindex="0" onclick=${onCloseTab}>
          <button>x</button>
        </div>
      </div>
    `
  }

  return html`
    <div
      class="tab ${activeClass} ${disabledClass}"
      tabindex=${active ? 0 : null}
      onclick=${onSelectTab}
      >
      <img class="icon" src="media/${icon}" />
      <div class="text">${text}</div>
    </div>
  `
}
