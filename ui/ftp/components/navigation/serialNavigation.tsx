import React from 'react'
import BreadCrumbs from '../shared/breadcrumbs'

const SerialNavigation: React.FC = ({ navigationLogic }) => {    
    const { serialPath = '', navigate } = navigationLogic()
    return <BreadCrumbs path={serialPath} navigate={navigate}></BreadCrumbs>
}

export default SerialNavigation