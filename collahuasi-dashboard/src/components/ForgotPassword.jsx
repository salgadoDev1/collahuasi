import React, { useState } from "react";
import { HiOutlineDatabase } from "react-icons/hi";
import { recoverPassword } from "../services/api";
import "../pages/Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await recoverPassword(email);
      setMessage(response.message || "Revisa tu correo para continuar.");
    } catch (error) {
      setError(
        error.response?.data?.message || "Error al procesar la solicitud."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          <HiOutlineDatabase className="login-icon" /> Collahuasi
        </h1>
        <p className="login-subtitle">Recuperar tu contraseña</p>
        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo"
              required
            />
          </div>
          <button type="submit" className="login-button">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
