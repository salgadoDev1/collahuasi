import React, { useState, useEffect, useCallback } from "react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import {
  createUser,
  fetchUsers,
  updateUser,
  deleteUser,
} from "../services/api";
import "./Usuarios.css";

const Usuarios = () => {
  const [users, setUsers] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", perfil: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const filtered = users.filter((row) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchText, users]);

  const handleDeleteUser = useCallback(async (id) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUser(id);
          Swal.fire("Eliminado", "El usuario ha sido eliminado.", "success");
          handleFetchUsers();
        } catch (error) {
          console.error("Error al eliminar usuario:", error);
          Swal.fire("Error", "No se pudo eliminar el usuario", "error");
        }
      }
    });
  }, []);

  const handleFetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const validUsers = await fetchUsers();

      // const fechaKeys = ["fecha_creacion", "fecha_actualizacion"];

      const dynamicColumns = Object.keys(validUsers[0])
        // .filter((key) => !fechaKeys.includes(key.toLowerCase()))
        .map((key) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          selector: (row) => row[key],
          sortable: true,
        }));

      dynamicColumns.push({
        name: "Acciones",
        cell: (row) => (
          <div className="actions">
            <button className="edit-button" onClick={() => handleEditUser(row)}>
              ✏️
            </button>
            <button
              className="delete-button"
              onClick={() => handleDeleteUser(row.id)}
            >
              🗑️
            </button>
          </div>
        ),
        ignoreRowClick: true,
      });

      setColumns(dynamicColumns);
      setUsers(validUsers);
      setFilteredData(validUsers);
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
      Swal.fire({
        icon: "error",
        title: "Error al cargar los usuarios",
        text: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [handleDeleteUser]);

  useEffect(() => {
    handleFetchUsers();
  }, [handleFetchUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.email || !form.perfil) {
      Swal.fire({
        icon: "warning",
        title: "Todos los campos son obligatorios",
      });
      return;
    }

    try {
      if (isEditing) {
        await updateUser(editId, form);
        Swal.fire(
          "Actualizado",
          "Usuario actualizado correctamente",
          "success"
        );
      } else {
        await createUser(form);
        Swal.fire("Creado", "Usuario creado correctamente", "success");
      }
      handleFetchUsers();
      setForm({ nombre: "", email: "", perfil: "" });
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      Swal.fire("Error", "No se pudo guardar el usuario", "error");
    }
  };

  const handleEditUser = (user) => {
    setForm({ nombre: user.nombre, email: user.email, perfil: user.perfil });
    setEditId(user.id);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setForm({ nombre: "", email: "", perfil: "" });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-section">
          <h1>{isEditing ? "Editar Usuario" : "Crear Usuario"}</h1>
          <p>
            Completa los campos para {isEditing ? "editar" : "crear"} un
            usuario.
          </p>
          <form onSubmit={handleSubmit} className="upload-form">
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleInputChange}
              placeholder="Nombre"
              className="file-input"
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="Correo Electrónico"
              className="file-input"
            />
            <select
              name="perfil"
              value={form.perfil}
              onChange={handleInputChange}
              className="file-input"
            >
              <option value="" disabled hidden>
                Seleccione un perfil
              </option>
              <option value="1">Perfil 1</option>
              <option value="2">Perfil 2</option>
            </select>

            <div className="form-buttons">
              <button type="submit" className="upload-button">
                {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="cancel-button"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="table-section">
          <div className="table-header">
            <h2>Usuarios Registrados</h2>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
          </div>
          {isLoading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p className="spinner-message">Cargando usuarios...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              highlightOnHover
              striped
              noDataComponent="No hay usuarios registrados."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
