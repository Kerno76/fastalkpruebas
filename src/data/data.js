import tutors from '../assets/tutors.png'
import students from '../assets/students.png'
import calendar from '../assets/calendar.png'
import hour from '../assets/hour.png'

export const entries = [
    {
        img: tutors,
        title: 'Total Tutors',
        amount: '20',
    },
    {
        img: students,
        title: 'Active Students',
        amount: '67'
    },
    {
        img: calendar,
        title: 'Sessions this month',
        amount: '33'
    },
    {
        img: hour,
        title: 'Hours Tutored',
        amount: '40 hrs'
    }
];

export const recentAct = [
  {
    id: 1,
    type: 'video',
    title: 'Nueva sesión agendada',
    description: 'El tutor Carlos R. agendó una sesión con Sofía M.',
    time: 'Hace 5 min',
    color: '#1976d2',
    bgColor: '#e3f2fd'
  },
  {
    id: 2,
    type: 'registro',
    title: 'Registro de actividad',
    description: 'El tutor Ana P. registró las horas',
    time: 'Hace 2 horas',
    color: '#ed6c02',
    bgColor: '#fff3e0'
  },
  {
    id: 3,
    type: 'usuario',
    title: 'Nuevo estudiante',
    description: 'Un nuevo estudiante ha sido registrado',
    time: 'Hace 3 horas',
    color: '#8fed02',
    bgColor: '#3d781b'
  }
];