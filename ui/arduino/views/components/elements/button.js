function Button(args) {
  const {
    first = false,
    size = '',
    square = false,
    icon = 'connect.svg',
    onClick = (e) => {},
    disabled = false,
    active = false,
    tooltip,
    label,
    background
  } = args
  let tooltipEl = html``
  if (tooltip) {
    tooltipEl = html`<div class="tooltip">${tooltip}</div>`
  }
  let activeClass = active ? 'active' : ''
  let backgroundClass = background ? 'inverted' : ''
  let buttonFirstClass = first ? 'first' : ''
  let squareClass = square ? 'square' : ''
  let labelActiveClass = disabled ? 'inactive' : 'active'
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
