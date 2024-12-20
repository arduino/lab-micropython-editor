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
    first,
    square
  } = args
  let tooltipEl = html``
  if (tooltip) {
    tooltipEl = html`<div class="tooltip">${tooltip}</div>`
  }
  let activeClass = active ? 'active' : 'inactive'
  let backgroundClass = background ? 'inverted' : ''
  let labelActiveClass = disabled ? 'inactive' : 'active'
  let buttonFirstClass = first ? 'first' : ''
  let squareClass = square ? 'square' : ''
  let labelItem = size === 'small' ? '' : html`<div class="label ${labelActiveClass}">${label}</div>`
  return html`
    <div class="button ${buttonFirstClass}">
      <button disabled=${disabled} class="${squareClass}${size} ${activeClass} ${backgroundClass}" onclick=${onClick}>
        <img class="icon" src="media/${icon}" />
      </button>
      ${labelItem}
      ${tooltipEl}
    </div>
  `
}
