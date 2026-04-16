export const studentsR = [
  {
    id: 1,
    name: 'Mario Alejandro Avendaño Olmos',
    level: 'B2',
    course: 'Ingles',
    tutor: 'Rogelio Perez'
  },
  {
    id: 2,
    name: 'Elvis Alain Calzada Trinidad',
    level: 'C1',
    course: 'Ingles',
    tutor: 'Daniel Perez'
  },
  {
    id: 3,
    name: 'Daniel Carballido Carreón',
    level: 'B1',
    course: 'Frances',
    tutor: 'Arturo Diaz'
  },
  {
    id: 4,
    name: 'Javier Juárez Pulido',
    level: 'A2',
    course: 'Frances',
    tutor: 'Emmanuel García'
  },
  {
    id: 5,
    name: 'Miguel Castañeda Ponce',
    level: 'C1',
    course: 'Frances',
    tutor: 'Jethro Paredes'
  },
  {
    id: 6,
    name: 'Luis Medina Ortiz',
    level: 'A1',
    course: 'Ingles',
    tutor: 'Diego García'
  }
];

export const studentStats = [
  {
    id: 1,
    title: 'Mi nivel de idioma',
    type: 'language',
    language: 'Inglés',
    level: 'B2 - Intermedio', 
    icon: 'nivel_actual',
    note: '¡Excelente! Tu progreso es constante.',
    target: 'C1'
  },
  {
    id: 2,
    title: 'Mi progreso',
    subtitle: 'Cantidad de sesiones a tomar',
    type: 'progress',
    current: 5,
    total: 16,
    icon: 'sesions_progress'
  },
  {
    id: 3,
    title: 'Mi tutor',
    subtitle: 'Sofía Matinez',
    type: 'tutor',
    career: 'Ingles de Negocios',
    icon: 'my_tutor'
  },
  {
    id: 4,
    title: 'Próxima Sesión',
    date: 'Hoy, 4:00 PM',
    topic: 'Participación en Reuniones',
    icon: 'next_sesion',
    type: 'action'
  }
];

// Data Simulada (Esto vendría de tu backend/data file)
export const tutorInfo = {
  name: 'Sofía Martínez',
  specialty: 'Inglés de Negocios & TOEFL',
  bio: 'Soy Ing. en Sistemas y apasionada de la enseñanza. Me encanta viajar y leer. ¡Hagamos que aprender sea divertido!',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  email: 'A01731901@tec.mx',
  phone: '+52 55 1234 5678'
};

export const sesiones = [
  { 
    id: 1, 
    status: 'COMPLETADA', 
    date: '12 Oct. - 17:00', 
    color: 'green' 
  },
  { 
    id: 2, 
    status: 'PROGRAMADA', 
    date: '09 Nov. - 17:00', 
    color: 'blue' 
  },
  { 
    id: 3, 
    status: 'COMPLETADA', 
    date: '08 Nov. - 17:00', 
    color: 'green' 
  }
];

export const recursos = [
  { 
    id: 1, 
    type: 'pdf', 
    name: 'Guía de Conversación B2' 
  },
  { 
    id: 2, 
    type: 'doc', 
    name: 'Vocabulario Negocios' 
  },
  { 
    id: 3, 
    type: 'link', 
    name: 'Video TED Talk recomendado' 
  }
];