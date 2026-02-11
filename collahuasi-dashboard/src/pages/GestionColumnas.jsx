import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { addColumn, fetchColumns } from "../services/api";
import "./GestionColumnas.css";

const GestionColumnas = () => {
  const [form, setForm] = useState({
    columnName: "",
    columnType: "VARCHAR(100)",
  });
  const [columns, setColumns] = useState([]);
  const [filteredColumns, setFilteredColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // Nuevo estado para página actual

  const columnTypes = [
    { label: "Texto (VARCHAR)", value: "VARCHAR(100)" },
    { label: "Texto Largo (TEXT)", value: "TEXT" },
    { label: "Número Entero (INT)", value: "INT" },
    { label: "Número Decimal (DECIMAL)", value: "DECIMAL(10, 2)" },
    { label: "Fecha (DATE)", value: "DATE" },
    { label: "Fecha y Hora (DATETIME)", value: "DATETIME" },
    { label: "Booleano (BIT)", value: "BIT" },
  ];

  useEffect(() => {
    fetchExistingColumns();
  }, []);

  useEffect(() => {
    const filtered = columns.filter((col) =>
      col.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredColumns(filtered);
  }, [searchText, columns]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.columnName) {
      Swal.fire({
        icon: "warning",
        title: "El nombre de la columna es obligatorio",
      });
      return;
    }
    try {
      await addColumn(form);
      Swal.fire("Éxito", "Columna agregada correctamente", "success");
      fetchExistingColumns();
      setForm({ columnName: "", columnType: "VARCHAR(100)" });
    } catch (error) {
      console.error("Error al agregar la columna:", error);
      Swal.fire("Error", "No se pudo agregar la columna", "error");
    }
  };

  const fetchExistingColumns = async () => {
    setIsLoading(true);
    try {
      const columnsData = await fetchColumns();
      setColumns(columnsData);
      setFilteredColumns(columnsData);
    } catch (error) {
      console.error("Error al obtener columnas:", error);
      Swal.fire({
        icon: "error",
        title: "Error al cargar columnas",
        text: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const columnsTable = [
    {
      name: "#",
      selector: (row, index) => (currentPage - 1) * 10 + index + 1, // Calcula índice global
      sortable: true,
      width: "80px",
    },
    {
      name: "Nombre de la Columna",
      selector: (row) => row,
      sortable: true,
    },
  ];

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-section">
          <h1>Agregar Columna</h1>
          <form onSubmit={handleSubmit} className="upload-form">
            <input
              type="text"
              name="columnName"
              value={form.columnName}
              onChange={handleInputChange}
              placeholder="Nombre de la columna"
              className="file-input"
            />
            <select
              name="columnType"
              value={form.columnType}
              onChange={handleInputChange}
              className="file-input"
            >
              {columnTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <button type="submit" className="upload-button">
              Agregar Columna
            </button>
          </form>
        </div>

        <div className="table-section">
          <div className="table-header">
            <h2>Columnas Existentes Datos Pivote</h2>
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
              <p className="spinner-message">Cargando columnas...</p>
            </div>
          ) : (
            <DataTable
              columns={columnsTable}
              data={filteredColumns}
              pagination
              paginationPerPage={10} // Define 10 filas por página
              paginationDefaultPage={currentPage} // Página actual
              onChangePage={(page) => setCurrentPage(page)} // Actualiza página
              highlightOnHover
              striped
              noDataComponent="No hay columnas registradas."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionColumnas;
