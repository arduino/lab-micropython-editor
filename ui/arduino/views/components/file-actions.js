function FileActions(state, emit, active = false) {
  const {
    isConnected,
    selectedFiles
  } = state
  return html`
  <div id="file-actions" class="${active ? 'active' : ''}" aria-hidden="${!active}">
    ${active ? Button({
      icon: 'arrow-left-white.svg',
      size: 'small',
      background: 'inverted',
      active: true,
      disabled: !canUpload({ isConnected, selectedFiles }),
      onClick: () => emit('upload-files')
    }) : null}
    ${active ? Button({
      icon: 'arrow-right-white.svg',
      size: 'small',
      background: 'inverted',
      active: true,
      disabled: !canDownload({ isConnected, selectedFiles }),
      onClick: () => emit('download-files')
    }) : null}
  </div>
  `
}
