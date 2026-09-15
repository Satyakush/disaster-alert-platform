import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ReportIncident from "./pages/ReportIncident";
import ReportReview from "./pages/ReportReview";
import ResponseTeam from "./pages/ResponseTeam";
import ResponderDashboard from "./pages/ResponderDashboard";
import Resources from "./pages/Resources";
import Infrastructure from "./pages/Infrastructure";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Unauthorized from "./pages/Unauthorized";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["user", "admin"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/responder" element={<ProtectedRoute allowedRoles={["responder", "admin"]}><ResponderDashboard /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute allowedRoles={["responder", "admin"]}><Resources /></ProtectedRoute>} />
          <Route path="/infrastructure" element={<ProtectedRoute allowedRoles={["responder", "admin"]}><Infrastructure /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ReportIncident /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin"]}><ReportReview /></ProtectedRoute>} />
          <Route path="/response-team" element={<ProtectedRoute allowedRoles={["admin"]}><ResponseTeam /></ProtectedRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
