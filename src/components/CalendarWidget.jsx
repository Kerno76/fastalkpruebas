import { useState } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import "../styles/Calendar.css"; 

export const CalendarWidget = ({ fechasAgendadas = [], onDateSelect }) => {
    const [date, setDate] = useState(new Date());

    const handleDateChange = (newDate) => {
        setDate(newDate);
        if (onDateSelect) {
            onDateSelect(dayjs(newDate));
        }
    };

    const renderPuntitos = ({ date, view }) => {
        if (view === 'month') {
            const fechaStr = dayjs(date).format('YYYY-MM-DD');
            const listadoFechas = Array.isArray(fechasAgendadas) ? fechasAgendadas : [];
            
            if (listadoFechas.includes(fechaStr)) {
                return (
                    <div style={{ 
                        height: '6px', 
                        width: '6px', 
                        backgroundColor: '#f59e0b', 
                        borderRadius: '50%', 
                        margin: '0 auto', 
                        marginTop: '4px' 
                    }} />
                );
            }
        }
        return null; 
    };

    return (
        <div className="custom-calendar-container">
            <Calendar
                onChange={handleDateChange}
                value={date}
                tileContent={renderPuntitos}
            />
        </div>
    );
};