import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");

    //Redirect to login if not auth'd
    if (!token) {
        return <Navigate to="/" replace />;
    }

    return children;
}