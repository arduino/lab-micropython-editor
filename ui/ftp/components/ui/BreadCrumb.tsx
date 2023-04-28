
const BreadCrumb = (path: string, navigate: (p: string) => void) => {
  let pathArray = []
  if (path) {
    pathArray = ['/'].concat(
      path.split('/').filter(s => s !== '')
    )
  }
  if (pathArray.length > 2) {
    pathArray = pathArray.slice(-3)
  }
  return pathArray.map((name, i) => {
    const crumbs = path.split('/').filter(c => c !== '')
    const p = '/' + crumbs.slice(0, i).join('/')
    return (
      <a className="breadcrumb" key={i} onClick={() => navigate(p)}>{name}</a>
    )
  })
}

export default BreadCrumb
