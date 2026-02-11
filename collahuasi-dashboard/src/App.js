import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import SubirBD from "./pages/SubirBD";
import Login from "./pages/login";
import GestionColumnas from "./pages/GestionColumnas";
import { getCurrentUser } from "./services/api";
import "./styles/App.css";

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

const AppRoutes = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    // Solo llama a fetchUser si no está en rutas públicas
    if (
      !["/", "/forgot-password", "/reset-password", "/logout"].includes(
        location.pathname
      )
    ) {
      fetchUser();
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [location.pathname]);

  if (
    isAuthenticated === null &&
    !["/", "/forgot-password", "/reset-password", "/logout"].includes(
      location.pathname
    )
  ) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      {!["/", "/forgot-password", "/reset-password", "/logout"].includes(
        location.pathname
      ) &&
        isAuthenticated && <Navbar user={user} />}
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            <Login setUser={setUser} setIsAuthenticated={setIsAuthenticated} />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/usuarios"
          element={
            isAuthenticated ? (
              <Usuarios user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/subir-bd"
          element={
            isAuthenticated ? (
              <SubirBD user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/gestion-columnas"
          element={
            isAuthenticated ? (
              <GestionColumnas user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
      {!["/", "/forgot-password", "/reset-password", "/logout"].includes(
        location.pathname
      ) &&
        isAuthenticated && <Footer />}
    </>
  );
};

export default App;
