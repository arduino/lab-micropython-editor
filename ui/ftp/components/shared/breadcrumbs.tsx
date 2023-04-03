import React from 'react'
import Button from './button.tsx'
import styles from './breadcrumbs.module.scss'

const BreadCrumbs: React.FC = ({ path, navigate }) => {
  if (!path) return <></>
  const pathArray = path.split('/')
  const crumbs = pathArray.filter(crumb => crumb != '')

  const onClick = (i) => () => {
    const newPath = '/' + crumbs.slice(0, i+1).join('/')
    navigate(newPath)
  }
  const items = crumbs.map(
    (folder, i) => (
      <span key={i}>
        <Button onClick={onClick(i)}>{folder||'/'}</Button>
      </span>
    )
  )
  return (
    <div className={styles.body}>
      <span><Button onClick={() => navigate('/')}>/</Button></span>
      {items}
    </div>
  )
}

export default BreadCrumbs
