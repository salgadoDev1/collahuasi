import axios from 'axios';

const apiClient = axios.create({
  // PASO A PRODUCCIÓN: Cambiar por la URL real de tu API (ej. 'https://api.tu-dominio.com/api')
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const getCurrentUser = async () => {
  const response = await apiClient.get('/me');
  if (response.status === 200 && response.data.success) {
    return response.data.user;
  }
  throw new Error(response.data.message || 'No se pudo obtener el usuario');
};

export const fetchData = async () => {
  const response = await apiClient.get('/get-data');
  if (response.status === 200 && response.data.success) {
    return response.data.data.filter(
      (item) => item.nombre !== null && item.descripcion !== null,
    );
  } else {
    throw new Error(
      response.data.message || 'La API devolvió un formato inesperado',
    );
  }
};

export const fetchDatacs = async () => {
  const response = await apiClient.get('/get-data-cs');
  if (response.status === 200 && response.data.success) {
    return response.data.data.filter(
      (item) => item.nombre !== null && item.descripcion !== null,
    );
  } else {
    throw new Error(
      response.data.message || 'La API devolvió un formato inesperado',
    );
  }
};

export const fetchDatamv = async () => {
  const response = await apiClient.get('/get-data-mv');
  if (response.status === 200 && response.data.success) {
    return response.data.data.filter(
      (item) => item.nombre !== null && item.descripcion !== null,
    );
  } else {
    throw new Error(
      response.data.message || 'La API devolvió un formato inesperado',
    );
  }
};

export const uploadFile = async (file, setUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/upload-excel', formData, {
    onUploadProgress: (progressEvent) => {
      const progress = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total,
      );
      setUploadProgress(progress);
    },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};

export const fetchUsers = async () => {
  const response = await apiClient.get('/get-data-user');
  if (response.status === 200 && response.data.success) {
    return response.data.data.filter(
      (user) => user.nombre !== null && user.email !== null,
    );
  } else {
    throw new Error(
      response.data.message ||
      'La API devolvió un formato inesperado al listar usuarios',
    );
  }
};

export const deleteDocument = async (token) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.delete(`/delete-excel/${token}`);
  if (response.status === 200 && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'Error al eliminar los registros');
  }
};

export const fetchFileNames = async () => {
  const response = await apiClient.get('/file-names');
  if (response.status === 200 && response.data.success) {
    return response.data.data;
  } else {
    throw new Error(
      response.data.message || 'Error al obtener los nombres de archivo',
    );
  }
};

export const createUser = async (user) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/create', user);
  if (response.status === 201 && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'Error al crear el usuario');
  }
};

export const updateUser = async (id, user) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post(`/update/${id}`, user);
  if (response.status === 200 && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'Error al actualizar el usuario');
  }
};

export const deleteUser = async (id) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.delete(`/delete/${id}`);
  if (response.status === 200 && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'Error al eliminar el usuario');
  }
};

export const loginUser = async (email, password) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/login', { email, password });
  if (response.status === 200 && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'Credenciales incorrectas');
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/verify-otp', { email, otp });
  if (response.status === 200 && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'OTP inválido');
  }
};

export const logoutUser = async () => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/logout', {});
  if (response.status === 200 && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'Error al cerrar sesión');
  }
};

export const recoverPassword = async (email) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/auth/recover-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
};

export const addColumn = async (columnData) => {
  try {
    await apiClient.get('/csrf-token');
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    throw new Error('No se pudo obtener el token CSRF');
  }

  const response = await apiClient.post('/add-column', columnData);
  if (response.status === 200 || response.status === 201) {
    return response.data;
  } else {
    throw new Error(response.data.message || 'Error al agregar la columna');
  }
};

export const fetchColumns = async () => {
  const response = await apiClient.get('/get-columns');
  if (response.status === 200 && response.data.success) {
    return response.data.columns;
  } else {
    throw new Error(
      response.data.message || 'Error al obtener las columnas de la tabla',
    );
  }
};

export const fetchReporte1 = async (
  origen = '',
  destino = '',
  material = '',
  fase = '',
) => {
  const params = new URLSearchParams();
  if (origen) params.append('origen', origen);
  if (destino) params.append('destino', destino);
  if (material) params.append('material', material);
  if (fase) params.append('fase', fase);

  const response = await apiClient.get(
    `/reporte1${params.toString() ? `?${params.toString()}` : ''}`,
  );
  if (response.status === 200 && response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'Error al obtener el reporte 1');
  }
};

export const fetchReporte2 = async (
  año,
  mes,
  origen = '',
  destino = '',
  material = '',
  fase = '',
) => {
  try {
    const params = new URLSearchParams();
    params.append('año', año);
    params.append('mes', mes);
    if (origen) params.append('origen', origen);
    if (destino) params.append('destino', destino);
    if (material) params.append('material', material);
    if (fase) params.append('fase', fase);

    console.log('Request URL:', `/reporte2?${params.toString()}`);
    const resp = await apiClient.get(`/reporte2?${params.toString()}`);
    console.log('Response from apiClient.get:', resp);
    console.log('Response data:', resp.data);
    return resp.data;
  } catch (error) {
    console.error('Error in fetchReporte2:', error);
    if (error.response) {
      console.error('Error response:', error.response);
    }
    return [];
  }
};

export const fetchMinaVsPlanta = async (año, mes) => {
  const resp = await apiClient.get(`/mina-planta?año=${año}&mes=${mes}`);
  return resp.data;
};

export const fetchReporteMinaVsPlanta = async (año, mes) => {
  const resp = await apiClient.get(
    `/reporte-mina-vs-planta?año=${año}&mes=${mes}`,
  );
  return resp.data;
};

export const getOrigenes = async () => {
  const response = await apiClient.get('/origenes');
  if (response.status === 200 && response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'Error al obtener los orígenes');
  }
};

export const getDestinos = async () => {
  const response = await apiClient.get('/destinos');
  if (response.status === 200 && response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'Error al obtener los destinos');
  }
};

export const getMateriales = async () => {
  const response = await apiClient.get('/materiales');
  if (response.status === 200 && response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'Error al obtener los materiales');
  }
};

export const getFases = async () => {
  const response = await apiClient.get('/fases');
  if (response.status === 200 && response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'Error al obtener las fases');
  }
};

export { apiClient };
