const DiskFileList = generateFileList('disk')
const BoardFileList = generateFileList('board')

function generateFileList(source) {
  return function(state, emit) {
    function onKeyEvent(e) {
      if(e.key.toLowerCase() === 'enter') {
        e.target.blur()
      }
      if(e.key.toLowerCase() === 'escape') {
        e.target.value = null
        e.target.blur()
      }
    }

    function FileItem(item, i) {
      const isChecked = state.selectedFiles.find(
        f => f.fileName === item.fileName && f.source === source
      )
      if (item.type === 'folder') {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''}"
            ondblclick=${() => emit(`navigate-${source}-folder`, item.fileName)}
            onclick=${() => emit('toggle-file-selection', item, source)}
            >
            <img class="icon" src="media/folder.svg" />
            <div class="text">${item.fileName}</div>
          </div>
        `
      } else {
        return html`
          <div
            class="item ${isChecked ? 'selected' : ''}"
            onclick=${() => emit('toggle-file-selection', item, source)}
            >
            <img class="icon" src="media/file.svg"  />
            <div class="text">${item.fileName}</div>
            <div class="options" onclick=${() => console.log('options', item)}>
              <img src="media/falafel.svg" />
            </div>
          </div>
        `
      }
    }

    const newFileItem = html`
      <div class="item">
        <img class="icon" src="media/file.svg" />
        <div class="text">
          <input type="text" onkeydown=${onKeyEvent} onblur=${(e) => emit('finish-creating', e.target.value)}/>
        </div>
      </div>
    `
    // XXX: Use `source` to filter an array of files with a `source` as proprety
    const list = html`
      <div class="file-list">
        <div class="list">
          <div class="item" ondblclick=${() => emit(`navigate-${source}-parent`)}>..</div>
          ${state.creatingFile == source ? newFileItem : null}
          ${state[`${source}Files`].map(FileItem)}
        </div>
      </div>
    `

    // Mutation observer
    const observer = new MutationObserver((mutations) => {
      const el = list.querySelector('input')
      if (el) {
        el.focus()
      }
    })
    observer.observe(list, { childList: true, subtree:true })

    return list
  }
}
