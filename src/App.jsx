import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Join from './pages/Join';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Questionnaire from './pages/Questionnaire';
import Result from './pages/Result';
import ResultDetails from './pages/ResultDetails';
import History from './pages/History';
import Daily from './pages/Daily';
import Coach from './pages/Coach';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="app-loading">Chargement…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<Join />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="questionnaire" element={<Questionnaire />} />
        <Route path="result/:id" element={<Result />} />
        <Route path="result/:id/details" element={<ResultDetails />} />
        <Route path="history" element={<History />} />
        <Route path="daily" element={<Daily />} />
        <Route path="coach" element={<Coach />} />
        <Route path="coach/:conversationId" element={<Coach />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
