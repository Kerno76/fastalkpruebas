import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }


    if (user.Rol === 'Admin') {
        return children;
    }

    if (allowedRoles && !allowedRoles.includes(user.Rol)) {
        const redirectionPath = user.Rol === 'Tutor' ? '/tutor' : '/estudianteDash';
        return <Navigate to={redirectionPath} replace />;
    }

    return children;
}