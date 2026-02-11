import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { logoutUser } from "../services/api";
import {
  FaDatabase,
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaColumns,
} from "react-icons/fa";
import { HiOutlineDatabase } from "react-icons/hi";
import "./Navbar.css";

const Navbar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Se cerrará tu sesión y volverás al inicio.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await logoutUser();
          navigate("/");
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
          Swal.fire("Error", "No se pudo cerrar la sesión", "error");
        }
      }
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">
          <HiOutlineDatabase className="navbar-icon" />
          Collahuasi
        </h1>
        {user && <p className="navbar-welcome">Bienvenido, {user.nombre}</p>}
        <ul className="navbar-links">
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard">
              <FaHome /> Dashboard
            </Link>
          </li>
          <li className={location.pathname === "/subir-bd" ? "active" : ""}>
            <Link to="/subir-bd">
              <FaDatabase /> Subir Datos
            </Link>
          </li>
          {user && parseInt(user.perfil, 10) === 1 && (
            <>
              <li
                className={
                  location.pathname === "/gestion-columnas" ? "active" : ""
                }
              >
                <Link to="/gestion-columnas">
                  <FaColumns /> Gestionar Columnas
                </Link>
              </li>
              <li className={location.pathname === "/usuarios" ? "active" : ""}>
                <Link to="/usuarios">
                  <FaUser /> Usuarios
                </Link>
              </li>
            </>
          )}
          <li>
            <button className="logout-button" onClick={handleLogout}>
              <FaSignOutAlt className="logout-icon" />
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
