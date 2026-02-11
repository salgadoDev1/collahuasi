import React, { useState } from "react";
import { HiOutlineDatabase } from "react-icons/hi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/api";
import "../pages/Login.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await resetPassword(token, newPassword);
      setMessage(response.message || "Contraseña actualizada correctamente.");
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      setError(
        error.response?.data?.message || "Error al restablecer la contraseña."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          <HiOutlineDatabase className="login-icon" /> Collahuasi
        </h1>
        <p className="login-subtitle">Restablecer tu contraseña</p>
        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="new-password">Nueva Contraseña</label>
            <input
              type="password"
              id="new-password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ingresa tu nueva contraseña"
              required
            />
          </div>
          <button type="submit" className="login-button">
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
