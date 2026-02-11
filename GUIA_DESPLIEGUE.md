# Manual de Despliegue a Producción - Sistema Collahuasi

Este documento detalla los pasos técnicos necesarios para transicionar el sistema desde el entorno de desarrollo/QA hacia un entorno de producción estable y seguro.

---

## 🏗️ 1. Configuración del Backend (project-api)

### 1.1 Variables de Entorno (.env)
Se deben ajustar los siguientes parámetros en el archivo `.env`:

| Variable | Acción Recomendada |
| :--- | :--- |
| `CLIENT_ORIGIN` | Cambiar por la URL pública del Dashboard (ej. `https://dashboard.empresa.com`). |
| `PORT` | Definir el puerto asignado por el servidor (ej. `3000`, `8080`). |
| `JWT_SECRET` | Generar una clave de 64 bytes (hex) aleatoria y segura. |
| `DISABLE_CSRF` | Establecer en `false` para habilitar la protección contra ataques CSRF. |
| `DB_SERVER` | Cambiar al endpoint del servidor SQL de producción. |
| `DB_NAME` | Definir el nombre de la base de datos de producción. |
| `EMAIL_USER` | Configurar cuenta de correo corporativa para envíos. |
| `EMAIL_PASS` | Password o App Password de la cuenta de correo. |

### 1.2 Seguridad en app.js
*   **CORS**: En el array `allowedOrigins`, incluir únicamente los dominios de confianza que consumirán la API.
*   **Cookies Colectadas**: Cambiar el flag `secure: false` a `secure: true` en todas las configuraciones de cookies (CSRF y JWT).
    > **Importante**: Requiere que el sitio corra bajo HTTPS.

---

## 💻 2. Configuración del Frontend (collahuasi-dashboard)

### 2.1 Archivo de Configuración (.env)
*   `REACT_APP_API_URL`: Cambiar por la URL pública de la API de producción (ej. `https://api.empresa.com/api`).
*   `DANGEROUSLY_DISABLE_HOST_CHECK`: Eliminar o establecer en `false` para prevenir ataques de DNS rebinding.

### 2.2 Servicio de API (src/services/api.js)
*   Verificar que la `baseURL` en la instancia de Axios esté sincronizada con la URL de producción.

---

## 🚀 3. Proceso de Despliegue e Infraestructura

### 3.1 Construcción del Cliente
Generar el paquete optimizado para producción:
```bash
cd collahuasi-dashboard
npm run build
```
La carpeta `/build` resultante debe ser servida mediante un servidor web como **Nginx**, **Apache** o un servicio de hosting estático.

### 3.2 Servidor de Aplicación (Backend)
Se recomienda el uso de un gestor de procesos para asegurar la alta disponibilidad:
```bash
cd project-api
npm install
pm2 start app.js --name "collahuasi-api"
pm2 save
```

### 3.3 Requisitos de Red
*   **SSL/TLS**: Es obligatorio contar con un certificado SSL para habilitar HTTPS, garantizando la seguridad de los tokens de sesión y la integridad de los datos.
*   **NODE_ENV**: Asegurarse de que el entorno del sistema operativo tenga definida la variable `NODE_ENV=production`.

---

## ✅ Checklist de Verificación Final
- [ ] Conectividad con la base de datos de producción validada.
- [ ] Envío de correos de recuperación de contraseña operativo.
- [ ] Cookies seguras activadas y validadas bajo HTTPS.
- [ ] Protección CSRF activa.
- [ ] Headers de seguridad de Helmet activos.
