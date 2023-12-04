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
      <div class="tab active" tabindex="0">
        <img class="icon" src="media/${icon}" />
        <div class="text">${text}</div>
        <div class="options" >
          <button onclick=${onCloseTab}>
            <img class="icon" src="media/close.svg" />
          </button>
        </div>
      </div>
    `
  }

  function selectTab(e) {
    if(e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') return
    onSelectTab(e)
  }

  return html`
    <div
      class="tab ${activeClass} ${disabledClass}"
      tabindex=${active ? 0 : null}
      onclick=${selectTab}
      >
      <img class="icon" src="media/${icon}" />
      <div class="text">${text}</div>
      <div class="options">
        <button onclick=${onCloseTab}>
          <img class="icon" src="media/close.svg" />
        </button>
      </div>
    </div>
  `
}
