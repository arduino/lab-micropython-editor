const { dialog } = require('electron')
const fs = require('fs')
const path = require('path')

async function openFolderDialog(win) {
  // https://stackoverflow.com/questions/46027287/electron-open-folder-dialog
  let dir = await dialog.showOpenDialog(win, { properties: [ 'openDirectory' ] })
  return dir.filePaths[0] || null
}

function listFolder(folder) {
  files = fs.readdirSync(path.resolve(folder))
  // Filter out directories
  files = files.filter(f => {
    let filePath = path.resolve(folder, f)
    return !fs.lstatSync(filePath).isDirectory()
  })
  return files
}

function ilistFolder(folder) {
  let files = fs.readdirSync(path.resolve(folder))
  files = files.filter(f => {
    let filePath = path.resolve(folder, f)
    return !fs.lstatSync(filePath).isSymbolicLink()
  })
  files = files.map(f => {
    let filePath = path.resolve(folder, f)
    return {
      path: f,
      type: fs.lstatSync(filePath).isDirectory() ? 'folder' : 'file'
    }
  })
  // Filter out dot files
  files = files.filter(f => f.path.indexOf('.') !== 0)
  return files
}

function getAllFiles(dirPath, arrayOfFiles) {
  // https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
  files = ilistFolder(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach(function(file) {
    const p = path.join(dirPath, file.path)
    const stat = fs.statSync(p)
    arrayOfFiles.push({
      path: p,
      type: stat.isDirectory() ? 'folder' : 'file'
    })
    if (stat.isDirectory()) {
      arrayOfFiles = getAllFiles(p, arrayOfFiles)
    }
  })
  return arrayOfFiles
}

module.exports = {
  openFolderDialog,
  listFolder,
  ilistFolder,
  getAllFiles
}
