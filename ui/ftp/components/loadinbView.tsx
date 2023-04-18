import React from 'react'

const LoadingView: React.FC = ({ logic }) => {
    const { waiting } = logic()
    if (waiting) return <div id="loading">Wait</div>
    return <></>
}

export default LoadingView
