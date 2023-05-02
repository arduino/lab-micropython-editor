
const NavigateUp = (path: string, navigate: (p: string) => void) => {
  if (!path || path === '/') return null
  const navigateUp = () => {
    const pathArray = path.split('/').filter(p => p)
    pathArray.pop()
    navigate('/'+pathArray.join('/'))
  }
  return (
    <div className={`list-item`} onClick={navigateUp}>
      <div className="checkbox">←</div><span>Back</span>
    </div>
  )
}

export default NavigateUp
