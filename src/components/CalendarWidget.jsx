import { useState } from "react"
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import "../styles/Calendar.css"


export const CalendarWidget = () => {

  const [date, setDate] = useState(new Date())

  const handleDateChange = (newDate) => {
    setDate(newDate)
    console.log("Fecha seleccionada:", newDate)
  }

  return (
    <div className="calendar">

      <Calendar
        onChange={handleDateChange}
        value={date}
      />

      <p>Selected date: {date.toDateString()}</p>
    </div>
  )
}

