function Button(args) {
  const {
    size = '',
    icon = 'connect.svg',
    onClick = () => false,
    disabled = false,
    active = false, 
    tooltip,
  } = args
  let tooltipEl = html``
  if (tooltip) {
    tooltipEl = html`<div class="tooltip">${tooltip}</div>`
  }
  let activeClass = active ? 'active' : ''
  return html`
  <div class="button">
    <button class="${size} ${activeClass}" onclick=${onClick} disabled=${disabled}>
      <img class="icon" src="media/${icon}" />
    </button>
    ${tooltipEl}
  </div>
  `
}
