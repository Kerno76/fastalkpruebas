import {navItems} from './data/navItems'
import {entries} from './data/data'
import {Card} from './components/Cards'
import './App.css'

function App() {
  return (
    <div className="dashboard">

      <div className="sidebar">
        <h2>English Tutoring Platform</h2> 
        <ul>
          {navItems.map((item, i) => (
            <li key={i}>
              <img src={item.icon} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mainContent">
        <h2 id='Title'>Dashboard</h2> 

        <div className="cardsContainer">
          {entries.map((entry, index) => (
            <Card
              key={index}
              img={entry.img}
              title={entry.title}
              amount={entry.amount}
            />
          ))}
        </div>

        <div className="bottomSection">

          <div className="recentActivity">
            <h2>Recent Activity</h2>
          </div>

          <div className="calendar">
            <h2>Calendar</h2>
          </div>

        </div>

      </div>

    </div>
  )
}

export default App
