import React from 'react'
import BreadCrumbs from '../shared/breadcrumbs'

const DiskNavigation: React.FC = ({ navigationLogic }) => {    
    const { diskPath = '', navigate } = navigationLogic()
    return <BreadCrumbs path={diskPath} navigate={navigate}></BreadCrumbs>
}

export default DiskNavigation