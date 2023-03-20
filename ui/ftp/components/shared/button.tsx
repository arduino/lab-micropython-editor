import React from 'react'
import styles from './button.module.scss'

const Button: React.FC = (attr) => {
  return <button {...attr} className={styles.button}></button>
}

export default Button