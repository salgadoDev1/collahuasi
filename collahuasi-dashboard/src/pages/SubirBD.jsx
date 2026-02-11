import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import {
  fetchData,
  fetchDatacs,
  fetchDatamv,
  uploadFile,
  fetchFileNames,
  deleteDocument,
} from "../services/api";
import "./SubirBD.css";

const SubirBD = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedOption, setSelectedOption] = useState("default");
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileNames, setFileNames] = useState([]);
  const [isDeleting, setIsDeleting] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];
  const years = Array.from({ length: 10 }, (_, i) => ({
    value: (2025 - i).toString(),
    label: (2025 - i).toString(),
  }));

  useEffect(() => {
    handleFetchData(selectedOption);
  }, [selectedOption]);

  useEffect(() => {
    let filtered = data;

    if (searchText) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    console.log("Datos antes del filtro:", data);

    if (
      (selectedOption === "mov" || selectedOption === "cs") &&
      selectedMonth &&
      selectedYear
    ) {
      const selectedDate = new Date(
        parseInt(selectedYear),
        parseInt(selectedMonth) - 1,
        1
      );

      const startDate = new Date(selectedDate);
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(
        new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
      );
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);

      console.log("Opción seleccionada:", selectedOption);
      console.log("Mes seleccionado:", selectedMonth);
      console.log("Año seleccionado:", selectedYear);
      console.log("startDate (último día del mes anterior):", startDate);
      console.log("endDate (penúltimo día del mes seleccionado):", endDate);

      filtered = filtered.filter((row) => {
        const dateField = selectedOption === "cs" ? "Fecha" : "fecha";
        let dateValue = row[dateField];

        if (!dateValue) {
          console.log(`Fila sin ${dateField} válida:`, row);
          return false;
        }

        dateValue = String(dateValue).trim();
        console.log(`Valor de ${dateField} recibido:`, dateValue);

        try {
          const [year, month, day] = dateValue.split("-");
          if (!year || !month || !day) {
            console.log(
              `Formato de fecha inválido en ${dateField}: ${dateValue}`
            );
            return false;
          }

          const rowDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
          if (isNaN(rowDate.getTime())) {
            console.log(`Fecha inválida en ${dateField}: ${dateValue}`);
            return false;
          }

          rowDate.setHours(0, 0, 0, 0);
          const isInInterval = rowDate >= startDate && rowDate <= endDate;
          console.log(
            `Comparando ${dateField} ${dateValue}:`,
            rowDate,
            `está en intervalo [${startDate} - ${endDate}]?`,
            isInInterval
          );
          return isInInterval;
        } catch (error) {
          console.error(
            `Error al parsear ${dateField} en fila: ${JSON.stringify(row)}`,
            error
          );
          return false;
        }
      });
    }

    console.log("Datos después del filtro:", filtered);
    setFilteredData(filtered);
  }, [searchText, data, selectedMonth, selectedYear, selectedOption]);

  const handleFetchData = async (option) => {
    setIsLoading(true);
    try {
      let validData;
      if (option === "cs") {
        validData = await fetchDatacs();
      } else if (option === "mov") {
        validData = await fetchDatamv();
      } else {
        validData = await fetchData();
      }

      console.log("Datos obtenidos:", validData);

      if (validData.length > 0) {
        const dynamicColumns = Object.keys(validData[0]).map((key) => ({
          name: key,
          selector: (row) => row[key],
          sortable: true,
        }));

        const idColumn = dynamicColumns.find(
          (col) => col.name.toLowerCase() === "id"
        );
        const otherColumns = dynamicColumns.filter(
          (col) => col.name.toLowerCase() !== "id"
        );

        const columnsToSet = idColumn
          ? [idColumn, ...otherColumns]
          : dynamicColumns;
        console.log("Columnas generadas:", columnsToSet);
        setColumns(columnsToSet);
      } else {
        setColumns([]);
      }

      setData(validData);
      setFilteredData(validData);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      setData([]);
      setFilteredData([]);
      setColumns([]);
      Swal.fire({
        icon: "error",
        title: "Error al cargar los datos",
        text: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      Swal.fire({ icon: "warning", title: "Por favor selecciona un archivo" });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const response = await uploadFile(file, (progress) => {
        setUploadProgress(progress * 0.8);
      });
      const {
        message,
        registrosHoja1,
        registrosHoja2,
        registrosHoja3,
        filaError,
      } = response.data;
      const processingInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 99) {
            clearInterval(processingInterval);
            return 99;
          }
          return prev + 1;
        });
      }, 100);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setUploadProgress(100);
      if (filaError) {
        Swal.fire({
          icon: "error",
          title: "Error en el archivo",
          text:
            message ||
            `Se encontró un problema en la fila ${filaError}. Por favor, revisa el archivo.`,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Datos insertados con éxito",
          text: message,
          footer: `Registros insertados en 'DATOS PIVOTE': ${registrosHoja1}, en 'CS01+CS02+CS03 (Planta)': ${registrosHoja2}, en 'CS01+CS02+CS03 (Movimin)': ${registrosHoja3}`,
        });
        handleFetchData(selectedOption);
      }
      setFile(null);
      document.querySelector("input[type='file']").value = "";
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      Swal.fire({
        icon: "error",
        title: "Error al subir el archivo",
        text:
          error.response?.data?.message ||
          "Ocurrió un error al procesar el archivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
    setSelectedMonth("");
    setSelectedYear("");
  };

  const handleOpenModal = async () => {
    try {
      const files = await fetchFileNames();
      setFileNames(files);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al cargar nombres de archivo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los documentos",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFileNames([]);
    setIsDeleting({});
  };

  const handleDeleteDocument = async (token, nombreArchivo) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Estás seguro?",
      text: `Se eliminarán todos los registros asociados al documento "${nombreArchivo}". Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        setIsDeleting((prev) => ({ ...prev, [token]: true }));
        const response = await deleteDocument(token);
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text:
            response.message ||
            `Los registros del documento "${nombreArchivo}" han sido eliminados.`,
        });
        setFileNames(fileNames.filter((file) => file.token !== token));
        handleFetchData(selectedOption);
      } catch (error) {
        console.error("Error al eliminar el documento:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo eliminar el documento",
        });
      } finally {
        setIsDeleting((prev) => ({ ...prev, [token]: false }));
      }
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-section">
          <h1>Subir Archivo</h1>
          <p>Selecciona un archivo Excel para cargarlo al sistema.</p>
          <form onSubmit={handleSubmit} className="upload-form">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isUploading}
              className="file-input"
            />
            <button
              type="submit"
              disabled={isUploading}
              className="upload-button"
            >
              {isUploading ? "Subiendo..." : "Subir Archivo"}
            </button>
          </form>
          <button
            onClick={handleOpenModal}
            className="upload-button"
            style={{ marginTop: "10px" }}
          >
            Ver Documentos Cargados
          </button>
          {isUploading && (
            <div className="progress-overlay">
              <div className="progress-wrapper">
                <div className="circular-progress">
                  <svg className="progress-ring" width="120" height="120">
                    <circle
                      className="progress-ring-circle"
                      stroke="var(--color-acento)"
                      strokeWidth="10"
                      fill="transparent"
                      r="50"
                      cx="60"
                      cy="60"
                      style={{
                        strokeDasharray: "314",
                        strokeDashoffset: `${
                          314 - (uploadProgress / 100) * 314
                        }`,
                      }}
                    />
                  </svg>
                  <div className="progress-text">
                    <span>{Math.floor(uploadProgress)}%</span>
                  </div>
                </div>
                <div className="progress-message-container">
                  <div className="spinner spinner-upload"></div>
                  <p className="progress-message">
                    Subiendo archivo, por favor espera...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="table-section">
          <h2>Datos Subidos</h2>
          <div className="table-controls">
            <div className="controls-row">
              <select
                id="data-select"
                value={selectedOption}
                className="file-input select-input"
                onChange={handleOptionChange}
                disabled={isLoading}
              >
                <option value="default">DATOS PIVOTE</option>
                <option value="cs">CS01+CS02+CS03 (Planta)</option>
                <option value="mov">CS01+CS02+CS03 (Movimin)</option>
              </select>
              {(selectedOption === "cs" || selectedOption === "mov") && (
                <div className="filter-container">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="file-input select-input"
                    disabled={isLoading}
                  >
                    <option value="">Selecciona Mes</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="file-input select-input"
                    disabled={isLoading}
                  >
                    <option value="">Selecciona Año</option>
                    {years.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <input
                type="text"
                placeholder="Buscar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          {isLoading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p className="spinner-message">Cargando datos...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              highlightOnHover
              striped
              noDataComponent="No hay datos disponibles."
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Documentos Cargados</h2>
            {fileNames.length === 0 ? (
              <p>No hay documentos cargados.</p>
            ) : (
              <ul className="file-list">
                {fileNames.map((file) => (
                  <li key={file.token} className="file-item">
                    <span>{file.nombre_archivo}</span>
                    {isDeleting[file.token] ? (
                      <div className="spinner spinner-delete"></div>
                    ) : (
                      <button
                        onClick={() =>
                          handleDeleteDocument(file.token, file.nombre_archivo)
                        }
                        className="delete-button"
                        title="Eliminar documento"
                        disabled={isDeleting[file.token]}
                      >
                        🗑️
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={handleCloseModal}
              className="upload-button modal-close"
              disabled={Object.values(isDeleting).some((deleting) => deleting)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubirBD;
