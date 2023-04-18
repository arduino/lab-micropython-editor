import React from 'react'

const DiskView: React.FC = ({ logic }) => {
    const { waiting } = logic()
    return (
      <div className="column file-panel">
        <div className="toolbar row full-width">
            <button>Select folder</button>
        </div>
        <div className="row full-width navigation">
          <button>/</button>
          <button>home</button>
          <button>projects</button>
          <button>arduino</button>
          <button>micropython</button>
          <button>example</button>
        </div>
        <div className="column full-width full-height list">
          <div className="list-item">
            <div className="checkbox">📁</div>
            lib
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>boot.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>main.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>turing_machine.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>README.md</span>
          </div>
          <div className="list-item">
            <div className="checkbox">📁</div>
            lib
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>boot.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>main.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>turing_machine.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>README.md</span>
          </div>
          <div className="list-item">
            <div className="checkbox">📁</div>
            lib
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>boot.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>main.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>turing_machine.py</span>
          </div>
          <div className="list-item">
            <input type="checkbox" />
            <span>README.md</span>
          </div>
        </div>
      </div>
    )
}

export default DiskView
