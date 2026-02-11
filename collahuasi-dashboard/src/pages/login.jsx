import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineDatabase } from "react-icons/hi";
import { loginUser, verifyOTP } from "../services/api";

const Login = ({ setUser, setIsAuthenticated }) => {
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [requires2FA, setRequires2FA] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(form.email, form.password);
      if (response.requires2FA) {
        setRequires2FA(true);
        if (response.qrCode) {
          setQrCode(response.qrCode);
        }
      } else {
        setUser(response.user);
        setIsAuthenticated(true);
        navigate("/dashboard");
      }
    } catch (error) {
      if (
        error.response?.status === 429 &&
        error.response?.data?.message ===
        "Demasiados intentos de inicio de sesión, intenta más tarde."
      ) {
        setIsBlocked(true);
        setTimeLeft(900);
      }
      setErrorMessage(
        error.response?.data?.message || "Error al iniciar sesión"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (isBlocked) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOTP(form.email, form.otp);
      setUser(response.user);
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (error) {
      if (
        error.response?.status === 429 &&
        error.response?.data?.message ===
        "Demasiados intentos de inicio de sesión, intenta más tarde."
      ) {
        setIsBlocked(true);
        setTimeLeft(900);
      }
      setErrorMessage(error.response?.data?.message || "OTP inválido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isBlocked && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsBlocked(false);
    }
  }, [isBlocked, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          <HiOutlineDatabase className="login-icon" /> Collahuasi
        </h1>
        <p className="login-subtitle">Inicia sesión para continuar</p>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        {isBlocked && (
          <p style={{ color: "red" }}>
            Estás bloqueado. Puedes intentar nuevamente en{" "}
            <strong>{formatTime(timeLeft)}</strong>.
          </p>
        )}
        {!requires2FA ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="Ingresa tu correo"
                required
                disabled={isBlocked}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                placeholder="Ingresa tu contraseña"
                required
                disabled={isBlocked}
              />
              <p>
                <Link to="/forgot-password" className="forgot-password-link">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            </div>
            <button
              type="submit"
              className="login-button"
              disabled={isLoading || isBlocked}
            >
              {isLoading ? <div className="spinner"></div> : "Iniciar Sesión"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="login-form">
            {qrCode && (
              <div className="form-group">
                <p>
                  Escanea este QR con tu app de autenticación (como Google
                  Authenticator):
                </p>
                <img
                  src={qrCode}
                  alt="Código QR"
                  style={{ maxWidth: "200px" }}
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="otp">Código OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={form.otp}
                onChange={handleInputChange}
                placeholder="Ingresa el código OTP"
                required
                disabled={isBlocked}
              />
            </div>
            <button
              type="submit"
              className="login-button"
              disabled={isLoading || isBlocked}
            >
              {isLoading ? <div className="spinner"></div> : "Verificar OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
