const Tooltip = (() => {
  let timer = null
  let el = null
  let lastX = 0
  let lastY = 0

  document.addEventListener('mousemove', (e) => {
    lastX = e.clientX
    lastY = e.clientY
  }, { passive: true })

  function getEl() {
    if (!el) {
      el = document.createElement('div')
      el.id = 'tooltip'
      document.body.appendChild(el)
    }
    return el
  }

  function show(text, anchor) {
    hide()
    if (!text) return
    timer = setTimeout(() => {
      const tip = getEl()
      tip.textContent = text
      tip.style.opacity = '0'
      tip.style.display = 'block'

      const tipRect = tip.getBoundingClientRect()
      const margin = 8
      const vw = window.innerWidth

      // Vertical: just above the current pointer position
      const top = lastY - tipRect.height - margin

      // Horizontal: centered on pointer, clamped to viewport
      let left = lastX - tipRect.width / 2
      left = Math.max(margin, Math.min(vw - tipRect.width - margin, left))

      tip.style.top = `${top}px`
      tip.style.left = `${left}px`
      tip.style.opacity = '1'
    }, 300)
  }

  function hide() {
    clearTimeout(timer)
    timer = null
    if (el) {
      el.style.display = 'none'
      el.style.opacity = '0'
    }
  }

  return { show, hide }
})()
