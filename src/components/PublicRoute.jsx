import { Navigate } from 'react-router-dom';

export default function PublicRoute({ children }) {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (user) {
        if (user.Rol === 'Admin') return <Navigate to="/" replace />;
        if (user.Rol === 'Tutor') return <Navigate to="/tutor" replace />;
        if (user.Rol === 'Student') return <Navigate to="/estudianteDash" replace />;
        if (user.Rol === 'Reviewer') return <Navigate to="/dashboard-revisor" replace />;
    }

    return children;
}