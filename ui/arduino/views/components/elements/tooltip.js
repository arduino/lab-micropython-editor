const Tooltip = (() => {
  let timer = null
  let el = null

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

      const rect = anchor.getBoundingClientRect()
      const tipRect = tip.getBoundingClientRect()
      const margin = 6
      const vw = window.innerWidth

      // Vertical: prefer above, flip below if not enough room
      let top
      if (rect.top - tipRect.height - margin >= 0) {
        top = rect.top - tipRect.height - margin
      } else {
        top = rect.bottom + margin
      }

      // Horizontal: center over the anchor, clamped to viewport
      let left = rect.left + rect.width / 2 - tipRect.width / 2
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
