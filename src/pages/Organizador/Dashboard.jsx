import { entries, recentAct } from "../../data/data"
import { Card } from "../../components/Cards"
import { CalendarWidget } from "../../components/CalendarWidget"
import '../../styles/App.css';

// Importamos los iconos 
import VideocamIcon from '@mui/icons-material/Videocam';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Box, Typography, Avatar, Paper } from '@mui/material';

// Mapeamos los iconos al "type"
const iconMap = {
  video: <VideocamIcon />,
  registro: <HistoryEduIcon />,
  usuario: <PersonAddIcon />
};

export default function Dashboard() {
  return (
    <div className="mainContent">

      <h2 id="Title">Dashboard</h2>
      <p className="dashboard-subtitle">Bienvenido de vuelta. Aquí está tu resumen de actividades.</p>

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
          
          {recentAct.map((item) => (
            <Paper key={item.id} className="activity-card" elevation={0}>
              <Avatar 
                className="activity-avatar" 
                style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                {iconMap[item.type]}
              </Avatar>

              <Box className="activity-info">
                <Typography className="activity-title">{item.title}</Typography>
                <Typography className="activity-desc">{item.description}</Typography>
              </Box>

              <Typography className="activity-time">{item.time}</Typography>
            </Paper>
          ))}
          
        </div>

        <div className="calendar">
          <h2>Calendario</h2>
          <CalendarWidget></CalendarWidget>
        </div>

      </div>

    </div>
  )
}