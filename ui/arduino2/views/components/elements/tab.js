function Tab(args) {
  const {
    text = 'undefined',
<<<<<<< Updated upstream
    icon = 'media/computer.svg',
=======
    icon = 'computer.svg',
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <img class="icon" src=${icon} />
=======
        <img class="icon" src="media/${icon}" />
>>>>>>> Stashed changes
        <div class="text">${text}</div>
        <div class="options" tabindex="0" onclick=${onCloseTab}>x</div>
      </div>
    `
  }

  if (disabled) {
    return html`
      <div
        class="tab disabled"
        tabindex="0"
        >
<<<<<<< Updated upstream
        <img class="icon" src=${icon} />
=======
        <img class="icon" src="media/${icon}" />
>>>>>>> Stashed changes
        <div class="text">${text}</div>
        <div class="options" tabindex="0" onclick=${onCloseTab}>x</div>
      </div>
    `
  }

  return html`
    <div
      class="tab ${activeClass} ${disabledClass}"
      tabindex=${active ? 0 : null}
      onclick=${onSelectTab}
      >
<<<<<<< Updated upstream
      <img class="icon" src=${icon} />
=======
      <img class="icon" src="media/${icon}" />
>>>>>>> Stashed changes
      <div class="text">${text}</div>
    </div>
  `
}
