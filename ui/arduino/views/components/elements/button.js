function Button(args) {
  const {
    size = '',
    icon = 'connect.svg',
    onClick = (e) => false,
    disabled = false,
    active = false,
    label,
    tooltip,
    background,
    first
  } = args
  let tooltipEl = html``
  if (tooltip) {
    tooltipEl = html`<div class="tooltip">${tooltip}</div>`
  }
  let activeClass = active ? 'active' : ''
  let backgroundClass = background ? 'inverted' : ''
  let labelActiveClass = disabled ? '' : 'active'
  let buttonFirstClass = first ? 'first' : ''
  return html`
    <div class="button ${buttonFirstClass}">
      <button class="${size} ${activeClass} ${backgroundClass}" onclick=${onClick} disabled=${disabled}>
        <img class="icon" src="media/${icon}" />
      </button>
      <div class="label ${labelActiveClass}">${label}</div>
      ${tooltipEl}
    </div>
  `
}
