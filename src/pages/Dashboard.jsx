import { entries } from "../data/data"
import { Card } from "../components/Cards"
import { CalendarWidget } from "../components/CalendarWidget"

export default function Dashboard() {
  return (
    <div className="mainContent">

      <h2 id="Title">Dashboard</h2>

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
          <h2>Calendario</h2>
          <CalendarWidget></CalendarWidget>
        </div>

      </div>

    </div>
  )
}