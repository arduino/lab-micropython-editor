import React from 'react'
import Button from './button.tsx'
import styles from './breadcrumbs.module.scss'

const BreadCrumbs: React.FC = ({ path, navigate }) => {
    if (!path) return <></>
    const pathArray = path.split('/')
    const onClick = (folder) => () => {
        navigate(folder)
    }
    const items = pathArray.map(
        (folder, i) => (
            <span key={i}>
                <Button onClick={onClick(folder)}>{folder}</Button>/
            </span>
        )
    )
    return <div className={styles.body}>{items}</div>
}

export default BreadCrumbs