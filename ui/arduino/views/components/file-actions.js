function FileActions(state, emit) {
  const {
    isConnected,
    selectedFiles
  } = state
  return html`
  <div id="file-actions">
    ${Button({
      icon: 'edit.svg',
      size: 'small',
      disabled: !canEdit({ selectedFiles: state.selectedFiles }),
      onClick: () => emit('open-selected-files')
    })}
    ${Button({
      icon: 'arrow-left-white.svg',
      size: 'small',
      background: 'inverted',
      disabled: !canUpload({ isConnected, selectedFiles }),
      onClick: () => emit('upload-files')
    })}
    ${Button({
      icon: 'arrow-right-white.svg',
      size: 'small',
      background: 'inverted',
      disabled: !canDownload({ isConnected, selectedFiles }),
      onClick: () => emit('download-files')
    })}
    ${Button({
      icon: 'delete.svg',
      size: 'small',
      disabled: state.selectedFiles.length === 0,
      onClick: () => emit('remove-files')
    })}
  </div>

  `
}
