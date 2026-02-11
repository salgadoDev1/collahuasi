import React, { useState, useEffect, useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Card, Row, Col, Button, Form, Dropdown } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  BarController,
  LineController,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import DataTable from "react-data-table-component";
import { format } from "date-fns";

import {
  fetchReporte1,
  fetchReporte2,
  fetchReporteMinaVsPlanta,
  getOrigenes,
  getMateriales,
  getDestinos,
  getFases,
} from "../services/api";
import MultiSelect from "./MultiSelect";
import "./Dashboard.css";

const generateYears = (startYear) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  ChartTooltip,
  Legend
);

const mesOptions = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

const safeFormat = (dateValue, formatStr = "dd-MM-yyyy") => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "-";
  try {
    return format(d, formatStr);
  } catch (e) {
    console.error("Error formatting date:", dateValue, e);
    return "-";
  }
};

export default function Dashboard() {
  const [añoReporte1, setAñoReporte1] = useState(new Date().getFullYear());
  const [mesReporte1, setMesReporte1] = useState(new Date().getMonth() + 1);
  const [r1, setR1] = useState([]);
  const [r2, setR2] = useState([]);
  const [añoFilterReporte1, setAñoFilterReporte1] = useState("");
  const [mesFilterReporte1, setMesFilterReporte1] = useState("");
  const [origenFilterReporte1, setOrigenFilterReporte1] = useState("");
  const [destinoFilterReporte1, setDestinoFilterReporte1] = useState("");
  const [materialFilterReporte1, setMaterialFilterReporte1] = useState("");
  const [faseFilterReporte1, setFaseFilterReporte1] = useState("");
  const [faseFilterReporte2, setFaseFilterReporte2] = useState("");
  const [origenes, setOrigenes] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [fases, setFases] = useState([]);

  const [visibleColumns, setVisibleColumns] = useState({
    CuS: false,
    MoT: false,
    DWI: false,
    BWI: false,
    AI: false,
    VSED: false,
    CALC_PH_POND: false,
    TPD_AGUA: false,
    TPH_TOTAL: false,
    DENSIDAD: false,
    Factor_A: false,
    Suma_Arcillas: false,
    R1: false,
    R2: false,
    PQ: false,
    SW: false,
    Tpht_mp: false,
    Rmom_mp: false,
    arc_piro: false,
    arc_kao: false,
    arc_mont: false,
    arc_musc: false,
    UGM_1: false,
    UGM_2: false,
    UGM_3: false,
    UGM_4: false,
    UGM_5: false,
    UGM_6: false,
    UGM_11: false,
    UGM_12: false,
    UGM_13: false,
    UGM_14: false,
  });

  const [origenFilterReporte2, setOrigenFilterReporte2] = useState("");
  const [destinoFilterReporte2, setDestinoFilterReporte2] = useState("");
  const [materialFilterReporte2, setMaterialFilterReporte2] = useState("");

  const [visibleColumnsReporte2, setVisibleColumnsReporte2] = useState({
    CuS: false,
    MoT: false,
    DWI: false,
    BWI: false,
    AI: false,
    VSED: false,
    CALC_PH_POND: false,
    TPD_AGUA: false,
    TPH_TOTAL: false,
    DENSIDAD: false,
    Factor_A: false,
    Suma_Arcillas: false,
    R1: false,
    R2: false,
    PQ: false,
    SW: false,
    Tpht_mp: false,
    Rmom_mp: false,
    arc_piro: false,
    arc_kao: false,
    arc_mont: false,
    arc_musc: false,
    UGM_1: false,
    UGM_2: false,
    UGM_3: false,
    UGM_4: false,
    UGM_5: false,
    UGM_6: false,
    UGM_11: false,
    UGM_12: false,
    UGM_13: false,
    UGM_14: false,
  });

  const [añoReporte2, setAñoReporte2] = useState(new Date().getFullYear());
  const [mesReporte2, setMesReporte2] = useState(new Date().getMonth() + 1);
  const [reporte2Data, setReporte2Data] = useState({
    plantaData: [],
    moviminData: [],
  });

  const [isLoadingReporte2, setIsLoadingReporte2] = useState(false);
  const [visibleDatasetsR1, setVisibleDatasetsR1] = useState([]);
  const [visibleDatasetsR2, setVisibleDatasetsR2] = useState([]);

  const chartRefR1 = useRef(null);
  const chartRefR2 = useRef(null);

  const years = useMemo(() => generateYears(2017), []);

  useEffect(() => {
    getOrigenes()
      .then((data) => setOrigenes(data || []))
      .catch(() => setOrigenes([]));
    getDestinos()
      .then((data) => setDestinos(data || []))
      .catch(() => setDestinos([]));
    getMateriales()
      .then((data) => setMateriales(data || []))
      .catch(() => setMateriales([]));
    getFases()
      .then((data) => setFases(data || []))
      .catch(() => setFases([]));
  }, []);

  useEffect(() => {
    fetchReporte1(
      origenFilterReporte1,
      destinoFilterReporte1,
      materialFilterReporte1,
      faseFilterReporte1
    )
      .then((data) => {
        setR1(data || []);
        const allDatasets = datasetsReporte1.map((dataset) => dataset.label);
        setVisibleDatasetsR1(allDatasets);
      })
      .catch(() => setR1([]));
  }, [
    origenFilterReporte1,
    destinoFilterReporte1,
    materialFilterReporte1,
    faseFilterReporte1,
  ]);

  useEffect(() => {
    fetchReporte2(
      añoReporte1,
      mesReporte1,
      origenFilterReporte2,
      destinoFilterReporte2,
      materialFilterReporte2,
      faseFilterReporte2
    )
      .then((data) => {
        console.log("Data fetched for Reporte 2:", data);
        setR2(data || []);
        const allDatasets = datasetsReporte2.map((dataset) => dataset.label);
        setVisibleDatasetsR2(allDatasets); // Todos seleccionados por defecto
      })
      .catch((error) => {
        console.error("Error fetching Reporte 2:", error);
        setR2([]);
      });
  }, [
    añoReporte1,
    mesReporte1,
    origenFilterReporte2,
    destinoFilterReporte2,
    materialFilterReporte2,
    faseFilterReporte2,
  ]);

  useEffect(() => {
    setIsLoadingReporte2(true);
    fetchReporteMinaVsPlanta(añoReporte2, mesReporte2)
      .then((data) =>
        setReporte2Data({
          plantaData: data?.plantaData || [],
          moviminData: data?.moviminData || [],
        })
      )
      .catch(() => setReporte2Data({ plantaData: [], moviminData: [] }))
      .finally(() => setIsLoadingReporte2(false));
  }, [añoReporte2, mesReporte2]);

  const handleColumnsChangeReporte1 = (newColumns) => {
    setVisibleColumns(newColumns);
  };

  const handleColumnsChangeReporte2 = (newColumns) => {
    setVisibleColumnsReporte2(newColumns);
  };

  const handleDatasetChangeR1 = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    const chart = chartRefR1.current;
    if (chart) {
      datasetsReporte1.forEach((dataset, index) => {
        if (
          !["Tonelaje", "CuT", "CuS", "As", "MoT", "FeT"].includes(
            dataset.label
          )
        ) {
          const isVisible = selectedOptions.includes(dataset.label);
          chart.setDatasetVisibility(index, isVisible);
          chart.update();
        }
      });
    }
    setVisibleDatasetsR1(selectedOptions);
  };

  const handleDatasetChangeR2 = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    const chart = chartRefR2.current;
    if (chart) {
      datasetsReporte2.forEach((dataset, index) => {
        if (
          !["Tonelaje", "CuT", "CuS", "AsT", "MoT", "FeT"].includes(
            dataset.label
          )
        ) {
          const isVisible = selectedOptions.includes(dataset.label);
          chart.setDatasetVisibility(index, isVisible);
          chart.update();
        }
      });
    }
    setVisibleDatasetsR2(selectedOptions);
  };

  const allColumnsReporte1 = [
    { name: "Año", selector: (row) => row.año, sortable: true },
    {
      name: "Mes",
      selector: (row) => row.mes,
      sortable: true,
      cell: (row) => mesOptions[row.mes],
    },
    {
      name: "Sum Tonelaje",
      selector: (row) => row.tonaje,
      sortable: true,
      format: (row) => (row.tonaje ?? 0).toLocaleString(),
    },
    {
      name: "Sum CuT",
      selector: (row) => row.CuT,
      sortable: true,
      format: (row) => (row.CuT ?? 0).toFixed(3),
    },
    {
      name: "Sum As",
      selector: (row) => row.As,
      sortable: true,
      format: (row) => (row.As ?? 0).toFixed(3),
    },
    {
      name: "Sum FeT",
      selector: (row) => row.FeT,
      sortable: true,
      format: (row) => (row.FeT ?? 0).toFixed(3),
    },
    {
      name: "Sum Au",
      selector: (row) => row.Au,
      sortable: true,
      format: (row) => (row.Au ?? 0).toFixed(3),
    },
    {
      name: "Sum Ag",
      selector: (row) => row.Ag,
      sortable: true,
      format: (row) => (row.Ag ?? 0).toFixed(3),
    },
    {
      name: "Sum CuS",
      selector: (row) => row.CuS,
      sortable: true,
      format: (row) => (row.CuS ?? 0).toFixed(3),
      id: "CuS",
      color: "#0288d1",
    },
    {
      name: "Sum MoT",
      selector: (row) => row.MoT,
      sortable: true,
      format: (row) => (row.MoT ?? 0).toFixed(3),
      id: "MoT",
      color: "#7b1fa2",
    },
    {
      name: "Sum DWI",
      selector: (row) => row.DWI,
      sortable: true,
      format: (row) => (row.DWI ?? 0).toFixed(3),
      id: "DWI",
      color: "#d81b60",
    },
    {
      name: "Sum BWI",
      selector: (row) => row.BWI,
      sortable: true,
      format: (row) => (row.BWI ?? 0).toFixed(3),
      id: "BWI",
      color: "#5e35b1",
    },
    {
      name: "Sum AI",
      selector: (row) => row.AI,
      sortable: true,
      format: (row) => (row.AI ?? 0).toFixed(3),
      id: "AI",
      color: "#fbc02d",
    },
    {
      name: "Sum VSED",
      selector: (row) => row.VSED,
      sortable: true,
      format: (row) => (row.VSED ?? 0).toFixed(3),
      id: "VSED",
      color: "#455a64",
    },
    {
      name: "Sum PH",
      selector: (row) => row.CALC_PH_POND,
      sortable: true,
      format: (row) => (row.CALC_PH_POND ?? 0).toFixed(3),
      id: "CALC_PH_POND",
      color: "#ad1457",
    },
    {
      name: "Sum TPD Agua",
      selector: (row) => row.TPD_AGUA,
      sortable: true,
      format: (row) => (row.TPD_AGUA ?? 0).toFixed(3),
      id: "TPD_AGUA",
      color: "#1976d2",
    },
    {
      name: "Sum TPH Total",
      selector: (row) => row.TPH_TOTAL,
      sortable: true,
      format: (row) => (row.TPH_TOTAL ?? 0).toFixed(3),
      id: "TPH_TOTAL",
      color: "#ff9800",
    },
    {
      name: "Sum Densidad",
      selector: (row) => row.DENSIDAD,
      sortable: true,
      format: (row) => (row.DENSIDAD ?? 0).toFixed(3),
      id: "DENSIDAD",
      color: "#4caf50",
    },
    {
      name: "Sum Factor A",
      selector: (row) => row.Factor_A,
      sortable: true,
      format: (row) => (row.Factor_A ?? 0).toFixed(3),
      id: "Factor_A",
      color: "#e91e63",
    },
    {
      name: "Sum Suma Arcillas",
      selector: (row) => row.Suma_Arcillas,
      sortable: true,
      format: (row) => (row.Suma_Arcillas ?? 0).toFixed(3),
      id: "Suma_Arcillas",
      color: "#ab47bc",
    },
    {
      name: "Sum R1",
      selector: (row) => row.R1,
      sortable: true,
      format: (row) => (row.R1 ?? 0).toFixed(3),
      id: "R1",
      color: "#26a69a",
    },
    {
      name: "Sum R2",
      selector: (row) => row.R2,
      sortable: true,
      format: (row) => (row.R2 ?? 0).toFixed(3),
      id: "R2",
      color: "#ffca28",
    },
    {
      name: "Sum PQ",
      selector: (row) => row.PQ,
      sortable: true,
      format: (row) => (row.PQ ?? 0).toFixed(3),
      id: "PQ",
      color: "#0288d1",
    },
    {
      name: "Sum SW",
      selector: (row) => row.SW,
      sortable: true,
      format: (row) => (row.SW ?? 0).toFixed(3),
      id: "SW",
      color: "#f06292",
    },
    {
      name: "Sum Tpht mp",
      selector: (row) => row.Tpht_mp,
      sortable: true,
      format: (row) => (row.Tpht_mp ?? 0).toFixed(3),
      id: "Tpht_mp",
      color: "#8d6e63",
    },
    {
      name: "Sum Rmom mp",
      selector: (row) => row.Rmom_mp,
      sortable: true,
      format: (row) => (row.Rmom_mp ?? 0).toFixed(3),
      id: "Rmom_mp",
      color: "#5c6bc0",
    },
    {
      name: "Sum Pirofilita",
      selector: (row) => row.arc_piro,
      sortable: true,
      format: (row) => (row.arc_piro ?? 0).toFixed(3),
      id: "arc_piro",
      color: "#ef5350",
    },
    {
      name: "Sum Caolinita",
      selector: (row) => row.arc_kao,
      sortable: true,
      format: (row) => (row.arc_kao ?? 0).toFixed(3),
      id: "arc_kao",
      color: "#66bb6a",
    },
    {
      name: "Sum Illita",
      selector: (row) => row.arc_mont,
      sortable: true,
      format: (row) => (row.arc_mont ?? 0).toFixed(3),
      id: "arc_mont",
      color: "#ffca28",
    },
    {
      name: "Sum Muscovita",
      selector: (row) => row.arc_musc,
      sortable: true,
      format: (row) => (row.arc_musc ?? 0).toFixed(3),
      id: "arc_musc",
      color: "#ab47bc",
    },
    {
      name: "Sum UGM 1",
      selector: (row) => row.UGM_1,
      sortable: true,
      format: (row) => (row.UGM_1 ?? 0).toFixed(3),
      id: "UGM_1",
      color: "#ff7043",
    },
    {
      name: "Sum UGM 2",
      selector: (row) => row.UGM_2,
      sortable: true,
      format: (row) => (row.UGM_2 ?? 0).toFixed(3),
      id: "UGM_2",
      color: "#43a047",
    },
    {
      name: "Sum UGM 3",
      selector: (row) => row.UGM_3,
      sortable: true,
      format: (row) => (row.UGM_3 ?? 0).toFixed(3),
      id: "UGM_3",
      color: "#ffb300",
    },
    {
      name: "Sum UGM 4",
      selector: (row) => row.UGM_4,
      sortable: true,
      format: (row) => (row.UGM_4 ?? 0).toFixed(3),
      id: "UGM_4",
      color: "#8e24aa",
    },
    {
      name: "Sum UGM 5",
      selector: (row) => row.UGM_5,
      sortable: true,
      format: (row) => (row.UGM_5 ?? 0).toFixed(3),
      id: "UGM_5",
      color: "#d81b60",
    },
    {
      name: "Sum UGM 6",
      selector: (row) => row.UGM_6,
      sortable: true,
      format: (row) => (row.UGM_6 ?? 0).toFixed(3),
      id: "UGM_6",
      color: "#5e35b1",
    },
    {
      name: "Sum UGM 11",
      selector: (row) => row.UGM_11,
      sortable: true,
      format: (row) => (row.UGM_11 ?? 0).toFixed(3),
      id: "UGM_11",
      color: "#fbc02d",
    },
    {
      name: "Sum UGM 12",
      selector: (row) => row.UGM_12,
      sortable: true,
      format: (row) => (row.UGM_12 ?? 0).toFixed(3),
      id: "UGM_12",
      color: "#455a64",
    },
    {
      name: "Sum UGM 13",
      selector: (row) => row.UGM_13,
      sortable: true,
      format: (row) => (row.UGM_13 ?? 0).toFixed(3),
      id: "UGM_13",
      color: "#ad1457",
    },
    {
      name: "Sum UGM 14",
      selector: (row) => row.UGM_14,
      sortable: true,
      format: (row) => (row.UGM_14 ?? 0).toFixed(3),
      id: "UGM_14",
      color: "#1976d2",
    },
  ];

  const columnsReporte1 = useMemo(() => {
    const baseColumns = allColumnsReporte1.slice(0, 8);
    const additionalColumns = allColumnsReporte1
      .slice(8)
      .filter((col) => visibleColumns[col.id]);
    return [...baseColumns, ...additionalColumns];
  }, [visibleColumns]);

  const filteredDataReporte1 = useMemo(
    () =>
      r1.filter((row) => {
        const okA = añoFilterReporte1
          ? row.año === parseInt(añoFilterReporte1)
          : true;
        const okM = mesFilterReporte1
          ? row.mes === parseInt(mesFilterReporte1)
          : true;
        return okA && okM;
      }),
    [r1, añoFilterReporte1, mesFilterReporte1]
  );

  const labelsReporte1 = r1.map(
    (row) => `${row.año}-${mesOptions[row.mes].slice(0, 3)}`
  );
  const datosTonelajeR1 = r1.map((row) => row.tonaje ?? 0);
  const datosUGM1R1 = r1.map((row) => row.UGM_1 ?? 0);
  const datosUGM2R1 = r1.map((row) => row.UGM_2 ?? 0);
  const datosUGM3R1 = r1.map((row) => row.UGM_3 ?? 0);
  const datosUGM4R1 = r1.map((row) => row.UGM_4 ?? 0);
  const datosUGM5R1 = r1.map((row) => row.UGM_5 ?? 0);
  const datosUGM6R1 = r1.map((row) => row.UGM_6 ?? 0);
  const datosUGM11R1 = r1.map((row) => row.UGM_11 ?? 0);
  const datosUGM12R1 = r1.map((row) => row.UGM_12 ?? 0);
  const datosUGM13R1 = r1.map((row) => row.UGM_13 ?? 0);
  const datosUGM14R1 = r1.map((row) => row.UGM_14 ?? 0);
  const datosCuTR1 = r1.map((row) => row.CuT ?? 0);
  const datosCuSR1 = r1.map((row) => row.CuS ?? 0);
  const datosAsR1 = r1.map((row) => row.As ?? 0);
  const datosMoTR1 = r1.map((row) => row.MoT ?? 0);
  const datosFeTR1 = r1.map((row) => row.FeT ?? 0);
  const datosAuR1 = r1.map((row) => row.Au ?? 0);
  const datosAgR1 = r1.map((row) => row.Ag ?? 0);
  const datosDWIR1 = r1.map((row) => row.DWI ?? 0);
  const datosBWIR1 = r1.map((row) => row.BWI ?? 0);
  const datosAIR1 = r1.map((row) => row.AI ?? 0);
  const datosVSEDR1 = r1.map((row) => row.VSED ?? 0);
  const datosPHR1 = r1.map((row) => row.CALC_PH_POND ?? 0);
  const datosTPDAguaR1 = r1.map((row) => row.TPD_AGUA ?? 0);
  const datosTPHTotalR1 = r1.map((row) => row.TPH_TOTAL ?? 0);
  const datosDensidadR1 = r1.map((row) => row.DENSIDAD ?? 0);
  const datosFactorAR1 = r1.map((row) => row.Factor_A ?? 0);
  const datosSumaArcillasR1 = r1.map((row) => row.Suma_Arcillas ?? 0);
  const datosR1R1 = r1.map((row) => row.R1 ?? 0);
  const datosR2R1 = r1.map((row) => row.R2 ?? 0);
  const datosPQR1 = r1.map((row) => row.PQ ?? 0);
  const datosSWR1 = r1.map((row) => row.SW ?? 0);
  const datosTphtMpR1 = r1.map((row) => row.Tpht_mp ?? 0);
  const datosRmomMpR1 = r1.map((row) => row.Rmom_mp ?? 0);
  const datosArcPiroR1 = r1.map((row) => row.arc_piro ?? 0);
  const datosArcKaoR1 = r1.map((row) => row.arc_kao ?? 0);
  const datosArcMontR1 = r1.map((row) => row.arc_mont ?? 0);
  const datosArcMuscR1 = r1.map((row) => row.arc_musc ?? 0);

  const diasLabels = r2.map((r) => `D${r.día}`);
  const datosTonelajeR2 = r2.map((r) => r.tonaje ?? 0);
  const datosCuTR2 = r2.map((r) => r.CuT ?? 0);
  const datosCuSR2 = r2.map((r) => r.CuS ?? 0);
  const datosAsR2 = r2.map((r) => r.As ?? 0);
  const datosMoTR2 = r2.map((r) => r.MoT ?? 0);
  const datosFeTR2 = r2.map((r) => r.FeT ?? 0);
  const datosAuR2 = r2.map((r) => r.Au ?? 0);
  const datosAgR2 = r2.map((r) => r.Ag ?? 0);
  const datosDWIR2 = r2.map((r) => r.DWI ?? 0);
  const datosBWIR2 = r2.map((r) => r.BWI ?? 0);
  const datosAIR2 = r2.map((r) => r.AI ?? 0);
  const datosVSEDR2 = r2.map((r) => r.VSED ?? 0);
  const datosPHR2 = r2.map((r) => r.CALC_PH_POND ?? 0);
  const datosTPDAguaR2 = r2.map((r) => r.TPD_AGUA ?? 0);
  const datosTPHTotalR2 = r2.map((r) => r.TPH_TOTAL ?? 0);
  const datosDensidadR2 = r2.map((r) => r.DENSIDAD ?? 0);
  const datosFactorAR2 = r2.map((r) => r.Factor_A ?? 0);
  const datosSumaArcillasR2 = r2.map((r) => r.Suma_Arcillas ?? 0);
  const datosR1R2 = r2.map((r) => r.R1 ?? 0);
  const datosR2R2 = r2.map((r) => r.R2 ?? 0);
  const datosPQR2 = r2.map((r) => r.PQ ?? 0);
  const datosSWR2 = r2.map((r) => r.SW ?? 0);
  const datosTphtMpR2 = r2.map((r) => r.Tpht_mp ?? 0);
  const datosRmomMpR2 = r2.map((r) => r.Rmom_mp ?? 0);
  const datosArcPiroR2 = r2.map((r) => r.arc_piro ?? 0);
  const datosArcKaoR2 = r2.map((r) => r.arc_kao ?? 0);
  const datosArcMontR2 = r2.map((r) => r.arc_mont ?? 0);
  const datosArcMuscR2 = r2.map((r) => r.arc_musc ?? 0);

  const datasetsReporte1 = [
    {
      label: "Tonelaje",
      data: datosTonelajeR1,
      type: "bar",
      backgroundColor: "rgba(30,136,229,0.5)",
      borderColor: "#1e88e5",
      borderWidth: 1,
      yAxisID: "y",
      barThickness: 20,
      hidden: false,
    },
    {
      label: "CuT",
      data: datosCuTR1,
      type: "line",
      borderColor: "#43a047",
      backgroundColor: "rgba(67,160,71,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "CuS",
      data: datosCuSR1,
      type: "line",
      borderColor: "#0288d1",
      backgroundColor: "rgba(2,136,209,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "As",
      data: datosAsR1,
      type: "line",
      borderColor: "#ef5350",
      backgroundColor: "rgba(239,83,80,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "MoT",
      data: datosMoTR1,
      type: "line",
      borderColor: "#7b1fa2",
      backgroundColor: "rgba(123,31,162,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "FeT",
      data: datosFeTR1,
      type: "line",
      borderColor: "#ffb300",
      backgroundColor: "rgba(255,179,0,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "Au",
      data: datosAuR1,
      type: "line",
      borderColor: "#8e24aa",
      backgroundColor: "rgba(142,36,170,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Au"),
    },
    {
      label: "Ag",
      data: datosAgR1,
      type: "line",
      borderColor: "#ff7043",
      backgroundColor: "rgba(255,112,67,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Ag"),
    },
    {
      label: "DWI",
      data: datosDWIR1,
      type: "line",
      borderColor: "#d81b60",
      backgroundColor: "rgba(216,27,96,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("DWI"),
    },
    {
      label: "BWI",
      data: datosBWIR1,
      type: "line",
      borderColor: "#5e35b1",
      backgroundColor: "rgba(94,53,177,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("BWI"),
    },
    {
      label: "AI",
      data: datosAIR1,
      type: "line",
      borderColor: "#fbc02d",
      backgroundColor: "rgba(251,192,45,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("AI"),
    },
    {
      label: "VSED",
      data: datosVSEDR1,
      type: "line",
      borderColor: "#455a64",
      backgroundColor: "rgba(69,90,100,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("VSED"),
    },
    {
      label: "PH",
      data: datosPHR1,
      type: "line",
      borderColor: "#ad1457",
      backgroundColor: "rgba(173,20,87,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("PH"),
    },
    {
      label: "TPD Agua",
      data: datosTPDAguaR1,
      type: "line",
      borderColor: "#1976d2",
      backgroundColor: "rgba(25,118,210,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("TPD_Agua"),
    },
    {
      label: "TPH Total",
      data: datosTPHTotalR1,
      type: "line",
      borderColor: "#ff9800",
      backgroundColor: "rgba(255,152,0,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("TPH_Total"),
    },
    {
      label: "Densidad",
      data: datosDensidadR1,
      type: "line",
      borderColor: "#4caf50",
      backgroundColor: "rgba(76,175,80,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Densidad"),
    },
    {
      label: "Factor A",
      data: datosFactorAR1,
      type: "line",
      borderColor: "#e91e63",
      backgroundColor: "rgba(233,30,99,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Factor_A"),
    },
    {
      label: "Suma Arcillas",
      data: datosSumaArcillasR1,
      type: "line",
      borderColor: "#ab47bc",
      backgroundColor: "rgba(171,71,188,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Suma_Arcillas"),
    },
    {
      label: "R1",
      data: datosR1R1,
      type: "line",
      borderColor: "#26a69a",
      backgroundColor: "rgba(38,166,154,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("R1"),
    },
    {
      label: "R2",
      data: datosR2R1,
      type: "line",
      borderColor: "#ffca28",
      backgroundColor: "rgba(255,202,40,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("R2"),
    },
    {
      label: "PQ",
      data: datosPQR1,
      type: "line",
      borderColor: "#0288d1",
      backgroundColor: "rgba(2,136,209,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("PQ"),
    },
    {
      label: "SW",
      data: datosSWR1,
      type: "line",
      borderColor: "#f06292",
      backgroundColor: "rgba(240,98,146,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("SW"),
    },
    {
      label: "Tpht mp",
      data: datosTphtMpR1,
      type: "line",
      borderColor: "#8d6e63",
      backgroundColor: "rgba(141,110,99,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Tpht_mp"),
    },
    {
      label: "Rmom mp",
      data: datosRmomMpR1,
      type: "line",
      borderColor: "#5c6bc0",
      backgroundColor: "rgba(92,107,192,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Rmom_mp"),
    },
    {
      label: "Pirofilita",
      data: datosArcPiroR1,
      type: "line",
      borderColor: "#ef5350",
      backgroundColor: "rgba(239,83,80,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Pirofilita"),
    },
    {
      label: "Caolinita",
      data: datosArcKaoR1,
      type: "line",
      borderColor: "#66bb6a",
      backgroundColor: "rgba(102,187,106,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Caolinita"),
    },
    {
      label: "Illita",
      data: datosArcMontR1,
      type: "line",
      borderColor: "#ffca28",
      backgroundColor: "rgba(255,202,40,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Illita"),
    },
    {
      label: "Muscovita",
      data: datosArcMuscR1,
      type: "line",
      borderColor: "#ab47bc",
      backgroundColor: "rgba(171,71,188,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("Muscovita"),
    },
    {
      label: "UGM_1",
      data: datosUGM1R1,
      type: "line",
      borderColor: "#ff7043",
      backgroundColor: "rgba(255,112,67,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_1"),
    },
    {
      label: "UGM_2",
      data: datosUGM2R1,
      type: "line",
      borderColor: "#43a047",
      backgroundColor: "rgba(67,160,71,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_2"),
    },
    {
      label: "UGM_3",
      data: datosUGM3R1,
      type: "line",
      borderColor: "#ffb300",
      backgroundColor: "rgba(255,179,0,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_3"),
    },
    {
      label: "UGM_4",
      data: datosUGM4R1,
      type: "line",
      borderColor: "#8e24aa",
      backgroundColor: "rgba(142,36,170,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_4"),
    },
    {
      label: "UGM_5",
      data: datosUGM5R1,
      type: "line",
      borderColor: "#d81b60",
      backgroundColor: "rgba(216,27,96,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_5"),
    },
    {
      label: "UGM_6",
      data: datosUGM6R1,
      type: "line",
      borderColor: "#5e35b1",
      backgroundColor: "rgba(94,53,177,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_6"),
    },
    {
      label: "UGM_11",
      data: datosUGM11R1,
      type: "line",
      borderColor: "#fbc02d",
      backgroundColor: "rgba(251,192,45,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_11"),
    },
    {
      label: "UGM_12",
      data: datosUGM12R1,
      type: "line",
      borderColor: "#455a64",
      backgroundColor: "rgba(69,90,100,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_12"),
    },
    {
      label: "UGM_13",
      data: datosUGM13R1,
      type: "line",
      borderColor: "#ad1457",
      backgroundColor: "rgba(173,20,87,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_13"),
    },
    {
      label: "UGM_14",
      data: datosUGM14R1,
      type: "line",
      borderColor: "#1976d2",
      backgroundColor: "rgba(25,118,210,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR1.includes("UGM_14"),
    },
  ];

  const datasetsReporte2 = [
    {
      label: "Tonelaje",
      data: datosTonelajeR2,
      type: "bar",
      backgroundColor: "rgba(30,136,229,0.5)",
      borderColor: "#1e88e5",
      borderWidth: 1,
      yAxisID: "y",
      barThickness: 20,
      hidden: false,
    },
    {
      label: "CuT",
      data: datosCuTR2,
      type: "line",
      borderColor: "#43a047",
      backgroundColor: "rgba(67,160,71,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "CuS",
      data: datosCuSR2,
      type: "line",
      borderColor: "#0288d1",
      backgroundColor: "rgba(2,136,209,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "As",
      data: datosAsR2,
      type: "line",
      borderColor: "#ef5350",
      backgroundColor: "rgba(239,83,80,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "MoT",
      data: datosMoTR2,
      type: "line",
      borderColor: "#7b1fa2",
      backgroundColor: "rgba(123,31,162,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "FeT",
      data: datosFeTR2,
      type: "line",
      borderColor: "#ffb300",
      backgroundColor: "rgba(255,179,0,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: false,
    },
    {
      label: "Au",
      data: datosAuR2,
      type: "line",
      borderColor: "#8e24aa",
      backgroundColor: "rgba(142,36,170,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Au"),
    },
    {
      label: "Ag",
      data: datosAgR2,
      type: "line",
      borderColor: "#ff7043",
      backgroundColor: "rgba(255,112,67,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Ag"),
    },
    {
      label: "DWI",
      data: datosDWIR2,
      type: "line",
      borderColor: "#d81b60",
      backgroundColor: "rgba(216,27,96,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("DWI"),
    },
    {
      label: "BWI",
      data: datosBWIR2,
      type: "line",
      borderColor: "#5e35b1",
      backgroundColor: "rgba(94,53,177,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("BWI"),
    },
    {
      label: "AI",
      data: datosAIR2,
      type: "line",
      borderColor: "#fbc02d",
      backgroundColor: "rgba(251,192,45,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("AI"),
    },
    {
      label: "VSED",
      data: datosVSEDR2,
      type: "line",
      borderColor: "#455a64",
      backgroundColor: "rgba(69,90,100,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("VSED"),
    },
    {
      label: "PH",
      data: datosPHR2,
      type: "line",
      borderColor: "#ad1457",
      backgroundColor: "rgba(173,20,87,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("PH"),
    },
    {
      label: "TPD Agua",
      data: datosTPDAguaR2,
      type: "line",
      borderColor: "#1976d2",
      backgroundColor: "rgba(25,118,210,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("TPD_Agua"),
    },
    {
      label: "TPH Total",
      data: datosTPHTotalR2,
      type: "line",
      borderColor: "#ff9800",
      backgroundColor: "rgba(255,152,0,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("TPH_Total"),
    },
    {
      label: "Densidad",
      data: datosDensidadR2,
      type: "line",
      borderColor: "#4caf50",
      backgroundColor: "rgba(76,175,80,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Densidad"),
    },
    {
      label: "Factor A",
      data: datosFactorAR2,
      type: "line",
      borderColor: "#e91e63",
      backgroundColor: "rgba(233,30,99,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Factor_A"),
    },
    {
      label: "Suma Arcillas",
      data: datosSumaArcillasR2,
      type: "line",
      borderColor: "#ab47bc",
      backgroundColor: "rgba(171,71,188,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Suma_Arcillas"),
    },
    {
      label: "R1",
      data: datosR1R2,
      type: "line",
      borderColor: "#26a69a",
      backgroundColor: "rgba(38,166,154,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("R1"),
    },
    {
      label: "R2",
      data: datosR2R2,
      type: "line",
      borderColor: "#ffca28",
      backgroundColor: "rgba(255,202,40,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("R2"),
    },
    {
      label: "PQ",
      data: datosPQR2,
      type: "line",
      borderColor: "#0288d1",
      backgroundColor: "rgba(2,136,209,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("PQ"),
    },
    {
      label: "SW",
      data: datosSWR2,
      type: "line",
      borderColor: "#f06292",
      backgroundColor: "rgba(240,98,146,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("SW"),
    },
    {
      label: "Tpht mp",
      data: datosTphtMpR2,
      type: "line",
      borderColor: "#8d6e63",
      backgroundColor: "rgba(141,110,99,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Tpht_mp"),
    },
    {
      label: "Rmom mp",
      data: datosRmomMpR2,
      type: "line",
      borderColor: "#5c6bc0",
      backgroundColor: "rgba(92,107,192,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Rmom_mp"),
    },
    {
      label: "Pirofilita",
      data: datosArcPiroR2,
      type: "line",
      borderColor: "#ef5350",
      backgroundColor: "rgba(239,83,80,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Pirofilita"),
    },
    {
      label: "Caolinita",
      data: datosArcKaoR2,
      type: "line",
      borderColor: "#66bb6a",
      backgroundColor: "rgba(102,187,106,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Caolinita"),
    },
    {
      label: "Illita",
      data: datosArcMontR2,
      type: "line",
      borderColor: "#ffca28",
      backgroundColor: "rgba(255,202,40,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Illita"),
    },
    {
      label: "Muscovita",
      data: datosArcMuscR2,
      type: "line",
      borderColor: "#ab47bc",
      backgroundColor: "rgba(171,71,188,0.2)",
      tension: 0.3,
      yAxisID: "y1",
      hidden: !visibleDatasetsR2.includes("Muscovita"),
    },
  ];

  const columnsPlanta = [
    {
      name: "Fecha",
      selector: (row) => row.Fecha,
      sortable: true,
      format: (row) =>
        row.Fecha ? format(new Date(row.Fecha), "dd-MM-yyyy") : "-",
    },
    {
      name: "Ton",
      selector: (row) => row.Ton,
      sortable: true,
      format: (row) => (row.Ton ?? 0).toLocaleString(),
    },
    {
      name: "CuT",
      selector: (row) => row.CuT,
      sortable: true,
      format: (row) => (row.CuT ?? 0).toFixed(3),
    },
    {
      name: "CuS",
      selector: (row) => row.CuS,
      sortable: true,
      format: (row) => (row.CuS ?? 0).toFixed(3),
    },
    {
      name: "AsT",
      selector: (row) => row.AsT,
      sortable: true,
      format: (row) => (row.AsT ?? 0).toFixed(3),
    },
    {
      name: "MoT",
      selector: (row) => row.MoT,
      sortable: true,
      format: (row) => (row.MoT ?? 0).toFixed(3),
    },
    {
      name: "FeT",
      selector: (row) => row.FeT,
      sortable: true,
      format: (row) => (row.FeT ?? 0).toFixed(3),
    },
    {
      name: "rcu",
      selector: (row) => row.rcu,
      sortable: true,
      format: (row) => (row.rcu ?? 0).toFixed(3), // New rcu column
    },
    {
      name: "Dif AsT",
      selector: (row) => row.Dif_AsT,
      sortable: true,
      cell: (row) => (
        <span style={{ color: (row.Dif_AsT ?? 0) < 0 ? "red" : "green" }}>
          {(row.Dif_AsT ?? 0).toFixed(1)}%
        </span>
      ),
    },
    {
      name: "Dif CuT",
      selector: (row) => row.Dif_CuT,
      sortable: true,
      cell: (row) => (
        <span style={{ color: (row.Dif_CuT ?? 0) < 0 ? "red" : "green" }}>
          {(row.Dif_CuT ?? 0).toFixed(1)}%
        </span>
      ),
    },
    {
      name: "Dif MoT",
      selector: (row) => row.Dif_MoT,
      sortable: true,
      cell: (row) => (
        <span style={{ color: (row.Dif_MoT ?? 0) < 0 ? "red" : "green" }}>
          {(row.Dif_MoT ?? 0).toFixed(1)}%
        </span>
      ),
    },
  ];

  const columnsMovimin = [
    {
      name: "Fecha",
      selector: (row) => row.fecha,
      sortable: true,
      format: (row) =>
        row.fecha ? format(new Date(row.fecha), "dd-MM-yyyy") : "-",
    },
    {
      name: "Ton",
      selector: (row) => row.ton,
      sortable: true,
      format: (row) => (row.ton ?? 0).toLocaleString(),
    },
    {
      name: "CuT",
      selector: (row) => row.cut,
      sortable: true,
      format: (row) => (row.cut ?? 0).toFixed(3),
    },
    {
      name: "CuS",
      selector: (row) => row.cus,
      sortable: true,
      format: (row) => (row.cus ?? 0).toFixed(3),
    },
    {
      name: "AsT",
      selector: (row) => row.ast,
      sortable: true,
      format: (row) => (row.ast ?? 0).toFixed(3),
    },
    {
      name: "MoT",
      selector: (row) => row.mot,
      sortable: true,
      format: (row) => (row.mot ?? 0).toFixed(3),
    },
    {
      name: "FeT",
      selector: (row) => row.fet,
      sortable: true,
      format: (row) => (row.fet ?? 0).toFixed(3),
    },
    {
      name: "rcu",
      selector: (row) => row.rec_glob,
      sortable: true,
      format: (row) => (row.rec_glob ?? 0).toFixed(3),
    },
  ];

  const allColumnsReporte2 = [
    {
      name: "Día",
      selector: (row) => row.día,
      sortable: true,
      width: "80px",
    },
    {
      name: "Tonelaje",
      selector: (row) => row.tonaje,
      sortable: true,
      format: (row) => (row.tonaje ?? 0).toLocaleString(),
    },
    {
      name: "CuT",
      selector: (row) => row.CuT,
      sortable: true,
      format: (row) => (row.CuT ?? 0).toFixed(3),
    },
    {
      name: "As",
      selector: (row) => row.As,
      sortable: true,
      format: (row) => (row.As ?? 0).toFixed(3),
    },
    {
      name: "FeT",
      selector: (row) => row.FeT,
      sortable: true,
      format: (row) => (row.FeT ?? 0).toFixed(3),
    },
    {
      name: "Au",
      selector: (row) => row.Au,
      sortable: true,
      format: (row) => (row.Au ?? 0).toFixed(3),
    },
    {
      name: "Ag",
      selector: (row) => row.Ag,
      sortable: true,
      format: (row) => (row.Ag ?? 0).toFixed(3),
    },
    {
      name: "CuS",
      selector: (row) => row.CuS,
      sortable: true,
      format: (row) => (row.CuS ?? 0).toFixed(3),
      id: "CuS",
      color: "#0288d1",
    },
    {
      name: "MoT",
      selector: (row) => row.MoT,
      sortable: true,
      format: (row) => (row.MoT ?? 0).toFixed(3),
      id: "MoT",
      color: "#7b1fa2",
    },
    {
      name: "DWI",
      selector: (row) => row.DWI,
      sortable: true,
      format: (row) => (row.DWI ?? 0).toFixed(3),
      id: "DWI",
      color: "#d81b60",
    },
    {
      name: "BWI",
      selector: (row) => row.BWI,
      sortable: true,
      format: (row) => (row.BWI ?? 0).toFixed(3),
      id: "BWI",
      color: "#5e35b1",
    },
    {
      name: "AI",
      selector: (row) => row.AI,
      sortable: true,
      format: (row) => (row.AI ?? 0).toFixed(3),
      id: "AI",
      color: "#fbc02d",
    },
    {
      name: "VSED",
      selector: (row) => row.VSED,
      sortable: true,
      format: (row) => (row.VSED ?? 0).toFixed(3),
      id: "VSED",
      color: "#455a64",
    },
    {
      name: "PH",
      selector: (row) => row.CALC_PH_POND,
      sortable: true,
      format: (row) => (row.CALC_PH_POND ?? 0).toFixed(3),
      id: "CALC_PH_POND",
      color: "#ad1457",
    },
    {
      name: "TPD Agua",
      selector: (row) => row.TPD_AGUA,
      sortable: true,
      format: (row) => (row.TPD_AGUA ?? 0).toFixed(3),
      id: "TPD_AGUA",
      color: "#1976d2",
    },
    {
      name: "TPH Total",
      selector: (row) => row.TPH_TOTAL,
      sortable: true,
      format: (row) => (row.TPH_TOTAL ?? 0).toFixed(3),
      id: "TPH_TOTAL",
      color: "#ff9800",
    },
    {
      name: "Densidad",
      selector: (row) => row.DENSIDAD,
      sortable: true,
      format: (row) => (row.DENSIDAD ?? 0).toFixed(3),
      id: "DENSIDAD",
      color: "#4caf50",
    },
    {
      name: "Factor A",
      selector: (row) => row.Factor_A,
      sortable: true,
      format: (row) => (row.Factor_A ?? 0).toFixed(3),
      id: "Factor_A",
      color: "#e91e63",
    },
    {
      name: "Suma Arcillas",
      selector: (row) => row.Suma_Arcillas,
      sortable: true,
      format: (row) => (row.Suma_Arcillas ?? 0).toFixed(3),
      id: "Suma_Arcillas",
      color: "#ab47bc",
    },
    {
      name: "R1",
      selector: (row) => row.R1,
      sortable: true,
      format: (row) => (row.R1 ?? 0).toFixed(3),
      id: "R1",
      color: "#26a69a",
    },
    {
      name: "R2",
      selector: (row) => row.R2,
      sortable: true,
      format: (row) => (row.R2 ?? 0).toFixed(3),
      id: "R2",
      color: "#ffca28",
    },
    {
      name: "PQ",
      selector: (row) => row.PQ,
      sortable: true,
      format: (row) => (row.PQ ?? 0).toFixed(3),
      id: "PQ",
      color: "#0288d1",
    },
    {
      name: "SW",
      selector: (row) => row.SW,
      sortable: true,
      format: (row) => (row.SW ?? 0).toFixed(3),
      id: "SW",
      color: "#f06292",
    },
    {
      name: "Tpht mp",
      selector: (row) => row.Tpht_mp,
      sortable: true,
      format: (row) => (row.Tpht_mp ?? 0).toFixed(3),
      id: "Tpht_mp",
      color: "#8d6e63",
    },
    {
      name: "Rmom mp",
      selector: (row) => row.Rmom_mp,
      sortable: true,
      format: (row) => (row.Rmom_mp ?? 0).toFixed(3),
      id: "Rmom_mp",
      color: "#5c6bc0",
    },
    {
      name: "Pirofilita",
      selector: (row) => row.arc_piro,
      sortable: true,
      format: (row) => (row.arc_piro ?? 0).toFixed(3),
      id: "arc_piro",
      color: "#ef5350",
    },
    {
      name: "Caolinita",
      selector: (row) => row.arc_kao,
      sortable: true,
      format: (row) => (row.arc_kao ?? 0).toFixed(3),
      id: "arc_kao",
      color: "#66bb6a",
    },
    {
      name: "Illita",
      selector: (row) => row.arc_mont,
      sortable: true,
      format: (row) => (row.arc_mont ?? 0).toFixed(3),
      id: "arc_mont",
      color: "#ffca28",
    },
    {
      name: "Muscovita",
      selector: (row) => row.arc_musc,
      sortable: true,
      format: (row) => (row.arc_musc ?? 0).toFixed(3),
      id: "arc_musc",
      color: "#ab47bc",
    },
    {
      name: "UGM 1",
      selector: (row) => row.UGM_1,
      sortable: true,
      format: (row) => (row.UGM_1 ?? 0).toFixed(3),
      id: "UGM_1",
      color: "#ff7043",
    },
    {
      name: "UGM 2",
      selector: (row) => row.UGM_2,
      sortable: true,
      format: (row) => (row.UGM_2 ?? 0).toFixed(3),
      id: "UGM_2",
      color: "#43a047",
    },
    {
      name: "UGM 3",
      selector: (row) => row.UGM_3,
      sortable: true,
      format: (row) => (row.UGM_3 ?? 0).toFixed(3),
      id: "UGM_3",
      color: "#ffb300",
    },
    {
      name: "UGM 4",
      selector: (row) => row.UGM_4,
      sortable: true,
      format: (row) => (row.UGM_4 ?? 0).toFixed(3),
      id: "UGM_4",
      color: "#8e24aa",
    },
    {
      name: "UGM 5",
      selector: (row) => row.UGM_5,
      sortable: true,
      format: (row) => (row.UGM_5 ?? 0).toFixed(3),
      id: "UGM_5",
      color: "#d81b60",
    },
    {
      name: "UGM 6",
      selector: (row) => row.UGM_6,
      sortable: true,
      format: (row) => (row.UGM_6 ?? 0).toFixed(3),
      id: "UGM_6",
      color: "#5e35b1",
    },
    {
      name: "UGM 11",
      selector: (row) => row.UGM_11,
      sortable: true,
      format: (row) => (row.UGM_11 ?? 0).toFixed(3),
      id: "UGM_11",
      color: "#fbc02d",
    },
    {
      name: "UGM 12",
      selector: (row) => row.UGM_12,
      sortable: true,
      format: (row) => (row.UGM_12 ?? 0).toFixed(3),
      id: "UGM_12",
      color: "#455a64",
    },
    {
      name: "UGM 13",
      selector: (row) => row.UGM_13,
      sortable: true,
      format: (row) => (row.UGM_13 ?? 0).toFixed(3),
      id: "UGM_13",
      color: "#ad1457",
    },
    {
      name: "UGM 14",
      selector: (row) => row.UGM_14,
      sortable: true,
      format: (row) => (row.UGM_14 ?? 0).toFixed(3),
      id: "UGM_14",
      color: "#1976d2",
    },
  ];

  const columnsReporte2 = useMemo(() => {
    const baseColumns = allColumnsReporte2.slice(0, 7);
    const additionalColumns = allColumnsReporte2
      .slice(7)
      .filter((col) => visibleColumnsReporte2[col.id]);
    return [...baseColumns, ...additionalColumns];
  }, [visibleColumnsReporte2]);

  const sortedPlantaData = useMemo(
    () =>
      [...reporte2Data.plantaData]
        .sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha))
        .map((row) => ({
          ...row,
          Ton: typeof row.Ton === "number" ? row.Ton : 0,
        })),
    [reporte2Data.plantaData]
  );

  const plantaTotals = useMemo(() => {
    const acum = sortedPlantaData.reduce(
      (acc, row) => ({
        Ton: acc.Ton + Number(row.Ton || 0),
        CuT: acc.CuT + Number(row.CuT || 0),
        CuS: acc.CuS + Number(row.CuS || 0),
        AsT: acc.AsT + Number(row.AsT || 0),
        MoT: acc.MoT + Number(row.MoT || 0),
        FeT: acc.FeT + Number(row.FeT || 0),
        rcu: acc.rcu + Number(row.rcu || 0),
      }),
      { Ton: 0, CuT: 0, CuS: 0, AsT: 0, MoT: 0, FeT: 0, rcu: 0 }
    );
    const cnt = sortedPlantaData.length || 1;
    return {
      totalTon: acum.Ton,
      avgCuT: acum.CuT / cnt,
      avgCuS: acum.CuS / cnt,
      avgAsT: acum.AsT / cnt,
      avgMoT: acum.MoT / cnt,
      avgFeT: acum.FeT / cnt,
      avgRcu: acum.rcu / cnt,
    };
  }, [sortedPlantaData]);

  const sortedMoviminData = useMemo(
    () =>
      [...reporte2Data.moviminData]
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .map((row) => ({
          ...row,
          ton: typeof row.ton === "number" ? row.ton : 0,
        })),
    [reporte2Data.moviminData]
  );

  const moviminTotals = useMemo(() => {
    const acum = sortedMoviminData.reduce(
      (acc, row) => {
        const recGlobValue = parseFloat(row.rec_glob) || 0;
        return {
          ton: acc.ton + Number(row.ton || 0),
          cut: acc.cut + Number(row.cut || 0),
          cus: acc.cus + Number(row.cus || 0),
          ast: acc.ast + Number(row.ast || 0),
          mot: acc.mot + Number(row.mot || 0),
          fet: acc.fet + Number(row.fet || 0),
          recGlob: acc.recGlob + recGlobValue,
        };
      },
      { ton: 0, cut: 0, cus: 0, ast: 0, mot: 0, fet: 0, recGlob: 0 }
    );
    const cnt = sortedMoviminData.length || 1;
    return {
      totalTon: acum.ton,
      avgCut: acum.cut / cnt,
      avgCus: acum.cus / cnt,
      avgAst: acum.ast / cnt,
      avgMot: acum.mot / cnt,
      avgFet: acum.fet / cnt,
      avgRecGlob: sortedMoviminData.length ? acum.recGlob / cnt : 0,
    };
  }, [sortedMoviminData]);

  const fechasReporte3 = sortedPlantaData.map((row) =>
    safeFormat(row.Fecha)
  );

  const tonPlanta = sortedPlantaData.map((row) => row.Ton ?? 0);
  const cutPlanta = sortedPlantaData.map((row) => row.CuT ?? 0);

  const tonMovimin = sortedPlantaData.map((plantaRow) => {
    const fechaStr = safeFormat(plantaRow.Fecha);
    const moviminRow = sortedMoviminData.find(
      (mov) => safeFormat(mov.fecha) === fechaStr
    );
    return moviminRow ? moviminRow.ton ?? 0 : 0;
  });

  const cutMovimin = sortedPlantaData.map((plantaRow) => {
    const fechaStr = safeFormat(plantaRow.Fecha);
    const moviminRow = sortedMoviminData.find(
      (mov) => safeFormat(mov.fecha) === fechaStr
    );
    return moviminRow ? moviminRow.cut ?? 0 : 0;
  });

  const exportToExcel = (
    plantaData,
    plantaColumns,
    moviminData,
    moviminColumns
  ) => {
    try {
      console.log("Iniciando exportación a Excel...");
      console.log("Datos Planta:", plantaData.slice(0, 2));
      console.log("Datos Movimin:", moviminData.slice(0, 2));
      console.log(
        "Columnas Planta:",
        plantaColumns.map((col) => col.name)
      );
      console.log(
        "Columnas Movimin:",
        moviminColumns.map((col) => col.name)
      );

      const normalizeKey = (key) => key.replace(/\s+/g, "_");

      const formatData = (data, columns) => {
        return data.map((row, rowIndex) => {
          const formattedRow = {};
          columns.forEach((col, colIndex) => {
            const key = col.name;
            const normalizedKey = normalizeKey(key);
            let value;

            try {
              value = col.selector(row) ?? "-";
              console.log(`Fila ${rowIndex}, Columna ${key}, Valor:`, value);

              if (key === "Fecha" || key === "fecha") {
                const dateValue =
                  value instanceof Date ? value : new Date(value);
                if (isNaN(dateValue.getTime())) {
                  console.warn(
                    `Fecha inválida en fila ${rowIndex}, columna ${key}:`,
                    value
                  );
                  formattedRow[key] = "-";
                } else {
                  formattedRow[key] = format(dateValue, "dd-MM-yyyy");
                }
              } else if (key === "Ton" || key === "ton") {
                formattedRow[key] =
                  typeof value === "number" ? value.toLocaleString() : "0";
              } else if (normalizedKey.includes("Dif_")) {
                formattedRow[key] =
                  typeof value === "number" ? `${value.toFixed(1)}%` : "0%";
              } else if (col.format) {
                formattedRow[key] = col.format(row);
              } else {
                formattedRow[key] = value ?? "-";
              }
            } catch (error) {
              console.error(
                `Error al formatear columna ${key} en fila ${rowIndex}:`,
                error.message,
                { row, value }
              );
              formattedRow[key] = "-";
            }
          });
          return formattedRow;
        });
      };

      console.log("Formateando datos de Planta...");
      const plantaFormatted = formatData(plantaData, plantaColumns);
      console.log("Datos formateados Planta:", plantaFormatted.slice(0, 2));

      console.log("Formateando datos de Movimin...");
      const moviminFormatted = formatData(moviminData, moviminColumns);
      console.log("Datos formateados Movimin:", moviminFormatted.slice(0, 2));

      const maxRows = Math.max(plantaFormatted.length, moviminFormatted.length);

      const combinedData = [];
      for (let i = 0; i < maxRows; i++) {
        const plantaRow = plantaFormatted[i] || {};
        const moviminRow = moviminFormatted[i] || {};
        const combinedRow = {
          ...plantaRow,
          " ": "",
          "  ": "",
          ...Object.keys(moviminRow).reduce((acc, key) => {
            acc[`Movimin_${key}`] = moviminRow[key];
            return acc;
          }, {}),
        };
        combinedData.push(combinedRow);
      }

      console.log("Creando hoja de trabajo...");
      const worksheet = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);

      const title = `Reporte Mina vs Planta - ${mesOptions[mesReporte2]} ${añoReporte2}`;
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" });

      const totalColumns = plantaColumns.length + 2 + moviminColumns.length;
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } }];

      XLSX.utils.sheet_add_aoa(ws, [["Planta"]], { origin: "C4" });
      const moviminStartCol = plantaColumns.length + 2;
      XLSX.utils.sheet_add_aoa(ws, [["Movimin"]], {
        origin: { r: 3, c: moviminStartCol + 2 },
      });

      XLSX.utils.sheet_add_json(ws, combinedData, {
        origin: "C6",
        skipHeader: false,
      });

      const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "004d7a" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
      const subtitleStyle = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "004d7a" } },
        alignment: { horizontal: "center" },
      };
      ws["A1"].s = titleStyle;
      ws["C4"].s = subtitleStyle;
      ws[XLSX.utils.encode_cell({ r: 3, c: moviminStartCol + 2 })].s =
        subtitleStyle;

      const range = XLSX.utils.decode_range(ws["!ref"]);
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "004d7a" } },
        alignment: { horizontal: "center" },
      };
      for (let col = 2; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = headerStyle;
      }

      const allColumns = [
        ...plantaColumns.map((col) => col.name),
        " ",
        "  ",
        ...moviminColumns.map((col) => `Movimin_${col.name}`),
      ];
      const colWidths = [];
      colWidths.push({ wch: 2 });
      colWidths.push({ wch: 2 });
      allColumns.forEach((colName, index) => {
        const columnData = combinedData.map((row) => row[colName] || "");
        const maxLength = Math.max(
          colName.length,
          ...columnData.map((val) => String(val).length)
        );
        colWidths.push({ wch: Math.min(maxLength + 2, 30) });
      });
      ws["!cols"] = colWidths;

      for (let row = 6; row <= range.e.r; row++) {
        for (let col = 2; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;
          const cell = ws[cellAddress];
          const colName = allColumns[col - 2];
          const normalizedColName = normalizeKey(colName);

          if (colName === "Ton" || normalizedColName.includes("Movimin_ton")) {
            cell.z = "#,##0";
          } else if (
            colName.includes("CuT") ||
            colName.includes("CuS") ||
            colName.includes("AsT") ||
            colName.includes("MoT") ||
            colName.includes("FeT") ||
            normalizedColName.includes("Movimin_rec_glob")
          ) {
            cell.z = "0.000";
          } else if (normalizedColName.includes("Dif_")) {
            cell.z = "0.0\\%";
          }
        }
      }

      console.log("Creando libro de trabajo...");
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, "Mina_vs_Planta");

      console.log("Generando archivo Excel...");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const dataBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      console.log("Descargando archivo...");
      saveAs(
        dataBlob,
        `Mina_vs_Planta_${mesOptions[mesReporte2]}_${añoReporte2}.xlsx`
      );
      console.log("Exportación completada con éxito.");
    } catch (error) {
      console.error(
        "Error durante la exportación a Excel:",
        error.message,
        error.stack
      );
      alert(
        "Ocurrió un error al exportar a Excel. Por favor, revisa la consola para más detalles."
      );
    }
  };

  const exportTableToExcel = (data, columns, fileName, sheetTitle) => {
    try {
      console.log(`Iniciando exportación a Excel para ${fileName}...`);
      console.log("Datos:", data.slice(0, 2));
      console.log(
        "Columnas:",
        columns.map((col) => col.name)
      );

      const normalizeKey = (key) => key.replace(/\s+/g, "_");

      const formatData = (data, columns) => {
        return data.map((row, rowIndex) => {
          const formattedRow = {};
          columns.forEach((col) => {
            const key = col.name;
            let value;

            try {
              value = col.selector(row) ?? "-";
              if (col.format) {
                formattedRow[key] = col.format(row);
              } else if (key === "Mes" && col.cell) {
                formattedRow[key] = col.cell(row);
              } else {
                formattedRow[key] = value;
              }
            } catch (error) {
              console.error(
                `Error al formatear columna ${key} en fila ${rowIndex}:`,
                error.message,
                { row, value }
              );
              formattedRow[key] = "-";
            }
          });
          return formattedRow;
        });
      };

      console.log("Formateando datos...");
      const formattedData = formatData(data, columns);
      console.log("Datos formateados:", formattedData.slice(0, 2));

      console.log("Creando hoja de trabajo...");
      const worksheet = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);

      XLSX.utils.sheet_add_aoa(ws, [[sheetTitle]], { origin: "A1" });
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
      ];

      XLSX.utils.sheet_add_json(ws, formattedData, {
        origin: "A3",
        skipHeader: false,
      });

      const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "004d7a" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
      ws["A1"].s = titleStyle;

      const range = XLSX.utils.decode_range(ws["!ref"]);
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "004d7a" } },
        alignment: { horizontal: "center" },
      };
      for (let col = 0; col < columns.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = headerStyle;
      }

      const colWidths = [];
      columns.forEach((col, index) => {
        const columnData = formattedData.map((row) => row[col.name] || "");
        const maxLength = Math.max(
          col.name.length,
          ...columnData.map((val) => String(val).length)
        );
        colWidths.push({ wch: Math.min(maxLength + 2, 30) });
      });
      ws["!cols"] = colWidths;

      for (let row = 3; row <= range.e.r; row++) {
        for (let col = 0; col < columns.length; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;
          const cell = ws[cellAddress];
          const colName = columns[col].name;
          const normalizedColName = normalizeKey(colName);

          if (colName.includes("Tonelaje")) {
            cell.z = "#,##0";
          } else if (
            normalizedColName.includes("CuT") ||
            normalizedColName.includes("CuS") ||
            normalizedColName.includes("As") ||
            normalizedColName.includes("MoT") ||
            normalizedColName.includes("FeT") ||
            normalizedColName.includes("Au") ||
            normalizedColName.includes("Ag") ||
            normalizedColName.includes("DWI") ||
            normalizedColName.includes("BWI") ||
            normalizedColName.includes("AI") ||
            normalizedColName.includes("VSED") ||
            normalizedColName.includes("PH") ||
            normalizedColName.includes("TPD") ||
            normalizedColName.includes("TPH") ||
            normalizedColName.includes("DENSIDAD") ||
            normalizedColName.includes("Factor_A") ||
            normalizedColName.includes("Suma_Arcillas") ||
            normalizedColName.includes("R1") ||
            normalizedColName.includes("R2") ||
            normalizedColName.includes("PQ") ||
            normalizedColName.includes("SW") ||
            normalizedColName.includes("Tpht_mp") ||
            normalizedColName.includes("Rmom_mp") ||
            normalizedColName.includes("arc_piro") ||
            normalizedColName.includes("arc_kao") ||
            normalizedColName.includes("arc_mont") ||
            normalizedColName.includes("arc_musc") ||
            normalizedColName.includes("UGM")
          ) {
            cell.z = "0.000";
          }
        }
      }

      console.log("Creando libro de trabajo...");
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, "Reporte");

      console.log("Generando archivo Excel...");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const dataBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      console.log("Descargando archivo...");
      saveAs(dataBlob, `${fileName}.xlsx`);
      console.log("Exportación completada con éxito.");
    } catch (error) {
      console.error(
        "Error durante la exportación a Excel:",
        error.message,
        error.stack
      );
      alert(
        "Ocurrió un error al exportar a Excel. Por favor, revisa la consola para más detalles."
      );
    }
  };

  const fmt = (n) =>
    n.toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="report-section">
          <div className="filter-section">
            <Form className="filter-form">
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Año</Form.Label>
                <Form.Select
                  value={añoFilterReporte1}
                  onChange={(e) => setAñoFilterReporte1(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Años</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Mes</Form.Label>
                <Form.Select
                  value={mesFilterReporte1}
                  onChange={(e) => setMesFilterReporte1(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Meses</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {mesOptions[i + 1]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Origen</Form.Label>
                <Form.Select
                  value={origenFilterReporte1}
                  onChange={(e) => setOrigenFilterReporte1(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Orígenes</option>
                  {origenes.map((origen) => (
                    <option key={origen} value={origen}>
                      {origen}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Destino</Form.Label>
                <Form.Select
                  value={destinoFilterReporte1}
                  onChange={(e) => setDestinoFilterReporte1(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Destinos</option>
                  {destinos.map((destino) => (
                    <option key={destino} value={destino}>
                      {destino}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Material</Form.Label>
                <Form.Select
                  value={materialFilterReporte1}
                  onChange={(e) => setMaterialFilterReporte1(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Materiales</option>
                  {materiales.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Fase</Form.Label>
                <Form.Select
                  value={faseFilterReporte1}
                  onChange={(e) => setFaseFilterReporte1(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todas las Fases</option>
                  {fases.map((fase) => (
                    <option key={fase} value={fase}>
                      {fase}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Button
                  className="export-button"
                  onClick={() =>
                    exportTableToExcel(
                      filteredDataReporte1,
                      allColumnsReporte1,
                      `Reporte1_${añoFilterReporte1 || "Todos"}_${mesFilterReporte1
                        ? mesOptions[mesFilterReporte1]
                        : "Todos"
                      }`,
                      `Reporte 1 - Tonelaje y Leyes por Año y Mes (${añoFilterReporte1 || "Todos los Años"
                      } - ${mesFilterReporte1
                        ? mesOptions[mesFilterReporte1]
                        : "Todos los Meses"
                      })`
                    )
                  }
                >
                  Exportar a Excel
                </Button>
              </Form.Group>
            </Form>
          </div>

          <Row className="mb-5">
            <Col>
              <Card className="dashboard-card">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <Card.Title className="dashboard-card-title mb-0">
                      Tonelaje y Leyes por Año y Mes
                    </Card.Title>
                    <div className="d-flex align-items-center">
                      <div className="column-toggle-section">
                        <MultiSelect
                          options={allColumnsReporte1.slice(8)}
                          selectedItems={visibleColumns}
                          onSelectionChange={handleColumnsChangeReporte1}
                          placeholder="Selecciona columnas..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="table-container">
                    <DataTable
                      columns={columnsReporte1}
                      data={filteredDataReporte1}
                      pagination
                      striped
                      highlightOnHover
                      responsive
                      noDataComponent={
                        <p className="no-data">No hay datos disponibles.</p>
                      }
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    />
                  </div>
                  <div className="filter-form">
                    <Form.Group className="filter-group ms-3">
                      <Form.Label
                        className="filter-label"
                        style={{ marginTop: "10px" }}
                      >
                        Seleccionar Datasets
                      </Form.Label>
                      <div className="dataset-grid">
                        {datasetsReporte1.map((dataset) => (
                          <div
                            key={dataset.label}
                            className={`dataset-chip ${visibleDatasetsR1.includes(dataset.label)
                              ? "selected"
                              : ""
                              }`}
                            style={{
                              borderColor: dataset.borderColor,
                            }}
                            onClick={() => {
                              const isChecked = !visibleDatasetsR1.includes(
                                dataset.label
                              );
                              const chart = chartRefR1.current;
                              if (chart) {
                                const index = datasetsReporte1.findIndex(
                                  (d) => d.label === dataset.label
                                );
                                if (index !== -1) {
                                  chart.setDatasetVisibility(index, isChecked);
                                  chart.update();
                                }
                              }
                              setVisibleDatasetsR1((prev) =>
                                isChecked
                                  ? [...prev, dataset.label]
                                  : prev.filter(
                                    (label) => label !== dataset.label
                                  )
                              );
                            }}
                          >
                            <Form.Check
                              type="checkbox"
                              id={`dataset-${dataset.label}-r1`}
                              checked={visibleDatasetsR1.includes(
                                dataset.label
                              )}
                              onChange={() => { }}
                            />
                            <span
                              className="dataset-color"
                              style={{ backgroundColor: dataset.borderColor }}
                            ></span>
                            <span className="dataset-label">
                              {dataset.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Form.Group>
                  </div>
                  <div className="chart-container">
                    <Line
                      ref={chartRefR1}
                      data={{
                        labels: labelsReporte1,
                        datasets: datasetsReporte1.map((dataset) =>
                          dataset.label === "Tonelaje"
                            ? {
                              ...dataset,
                              type: "bar",
                              hidden: !visibleDatasetsR1.includes("Tonelaje"),
                            }
                            : {
                              ...dataset,
                              type: "line",
                              hidden: !visibleDatasetsR1.includes(
                                dataset.label
                              ),
                            }
                        ),
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            position: "left",
                            title: {
                              display: true,
                              text: "Tonelaje",
                              color: getComputedStyle(document.documentElement)
                                .getPropertyValue("--primary-color")
                                .trim(),
                            },
                            suggestedMax:
                              datosTonelajeR1.length > 0
                                ? Math.max(...datosTonelajeR1) * 1.2
                                : 1000,
                          },
                          y1: {
                            beginAtZero: true,
                            position: "right",
                            title: {
                              display: true,
                              text: "Leyes",
                              color: getComputedStyle(document.documentElement)
                                .getPropertyValue("--primary-color")
                                .trim(),
                            },
                            grid: { drawOnChartArea: false },
                          },
                          x: {
                            grid: { color: "rgba(0,77,122,0.1)" },
                            barPercentage: 0.4,
                            categoryPercentage: 0.5,
                            ticks: {
                              autoSkip: false,
                              maxRotation: 45,
                              minRotation: 45,
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                let label = context.dataset.label || "";
                                if (label === "Tonelaje") {
                                  return `${label}: ${context.parsed.y.toLocaleString()} ton`;
                                }
                                return `${label}: ${context.parsed.y.toFixed(
                                  3
                                )}`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        <div className="report-section">
          <div className="filter-section">
            <Form className="filter-form">
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Año</Form.Label>
                <Form.Select
                  value={añoReporte1}
                  onChange={(e) => setAñoReporte1(+e.target.value)}
                  className="custom-select"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Mes</Form.Label>
                <Form.Select
                  value={mesReporte1}
                  onChange={(e) => setMesReporte1(+e.target.value)}
                  className="custom-select"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {mesOptions[i + 1]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Origen</Form.Label>
                <Form.Select
                  value={origenFilterReporte2}
                  onChange={(e) => setOrigenFilterReporte2(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Orígenes</option>
                  {origenes.map((origen) => (
                    <option key={origen} value={origen}>
                      {origen}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Destino</Form.Label>
                <Form.Select
                  value={destinoFilterReporte2}
                  onChange={(e) => setDestinoFilterReporte2(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Destinos</option>
                  {destinos.map((destino) => (
                    <option key={destino} value={destino}>
                      {destino}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Material</Form.Label>
                <Form.Select
                  value={materialFilterReporte2}
                  onChange={(e) => setMaterialFilterReporte2(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todos los Materiales</option>
                  {materiales.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Fase</Form.Label>
                <Form.Select
                  value={faseFilterReporte2}
                  onChange={(e) => setFaseFilterReporte2(e.target.value)}
                  className="custom-select"
                >
                  <option value="">Todas las Fases</option>
                  {fases.map((fase) => (
                    <option key={fase} value={fase}>
                      {fase}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Button
                  className="export-button"
                  onClick={() =>
                    exportTableToExcel(
                      r2,
                      allColumnsReporte2,
                      `Reporte2_${mesOptions[mesReporte1]}_${añoReporte1}`,
                      `Reporte 2 - Tonelaje y Leyes por Día (${mesOptions[mesReporte1]} ${añoReporte1})`
                    )
                  }
                >
                  Exportar a Excel
                </Button>
              </Form.Group>
            </Form>
          </div>
          <Row className="mb-5">
            <Col>
              <Card className="dashboard-card">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <Card.Title className="dashboard-card-title mb-0">
                      Tonelaje y Leyes por Día ({mesOptions[mesReporte1]}{" "}
                      {añoReporte1})
                    </Card.Title>
                    <div className="d-flex align-items-center gap-2">
                      <div className="column-toggle-section">
                        <MultiSelect
                          options={allColumnsReporte2.slice(7)}
                          selectedItems={visibleColumnsReporte2}
                          onSelectionChange={handleColumnsChangeReporte2}
                          placeholder="Selecciona columnas..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="table-container">
                    <DataTable
                      columns={columnsReporte2}
                      data={r2}
                      pagination
                      striped
                      highlightOnHover
                      responsive
                      noDataComponent={
                        <p className="no-data">No hay datos disponibles.</p>
                      }
                      paginationPerPage={30}
                      paginationRowsPerPageOptions={[10, 25, 30, 50]}
                    />
                  </div>
                  <div className="filter-form">
                    <Form.Group className="filter-group">
                      <Form.Label
                        className="filter-label"
                        style={{ marginTop: "10px" }}
                      >
                        Seleccionar Datasets
                      </Form.Label>
                      <div className="dataset-grid">
                        {datasetsReporte2.map((dataset) => (
                          <div
                            key={dataset.label}
                            className={`dataset-chip ${visibleDatasetsR2.includes(dataset.label)
                              ? "selected"
                              : ""
                              }`}
                            style={{
                              borderColor: dataset.borderColor,
                            }}
                            onClick={() => {
                              const isChecked = !visibleDatasetsR2.includes(
                                dataset.label
                              );
                              const chart = chartRefR2.current;
                              if (chart) {
                                const index = datasetsReporte2.findIndex(
                                  (d) => d.label === dataset.label
                                );
                                if (index !== -1) {
                                  chart.setDatasetVisibility(index, isChecked);
                                  chart.update();
                                }
                              }
                              setVisibleDatasetsR2((prev) =>
                                isChecked
                                  ? [...prev, dataset.label]
                                  : prev.filter(
                                    (label) => label !== dataset.label
                                  )
                              );
                            }}
                          >
                            <Form.Check
                              type="checkbox"
                              id={`dataset-${dataset.label}-r2`}
                              checked={visibleDatasetsR2.includes(
                                dataset.label
                              )}
                              onChange={() => { }}
                            />
                            <span
                              className="dataset-color"
                              style={{ backgroundColor: dataset.borderColor }}
                            ></span>
                            <span className="dataset-label">
                              {dataset.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Form.Group>
                  </div>
                  <div className="chart-container">
                    <Line
                      ref={chartRefR2}
                      data={{
                        labels: diasLabels,
                        datasets: datasetsReporte2.map((dataset) =>
                          dataset.label === "Tonelaje"
                            ? {
                              ...dataset,
                              type: "bar",
                              hidden: !visibleDatasetsR2.includes("Tonelaje"),
                            }
                            : {
                              ...dataset,
                              type: "line",
                              hidden: !visibleDatasetsR2.includes(
                                dataset.label
                              ),
                            }
                        ),
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            position: "left",
                            title: {
                              display: true,
                              text: "Tonelaje",
                              color: getComputedStyle(document.documentElement)
                                .getPropertyValue("--primary-color")
                                .trim(),
                            },
                            suggestedMax:
                              datosTonelajeR2.length > 0
                                ? Math.max(...datosTonelajeR2) * 1.2
                                : 1000,
                          },
                          y1: {
                            beginAtZero: true,
                            position: "right",
                            title: {
                              display: true,
                              text: "Leyes",
                              color: getComputedStyle(document.documentElement)
                                .getPropertyValue("--primary-color")
                                .trim(),
                            },
                            grid: { drawOnChartArea: false },
                          },
                          x: {
                            grid: { color: "rgba(0,77,122,0.1)" },
                            barPercentage: 0.4,
                            categoryPercentage: 0.5,
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                let label = context.dataset.label || "";
                                if (label === "Tonelaje") {
                                  return `${label}: ${context.parsed.y.toLocaleString()} ton`;
                                }
                                return `${label}: ${context.parsed.y.toFixed(
                                  3
                                )}`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        <div className="report-section">
          <div className="filter-section">
            <Form className="filter-form">
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Año</Form.Label>
                <Form.Select
                  value={añoReporte2}
                  onChange={(e) => setAñoReporte2(+e.target.value)}
                  className="custom-select"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="filter-group">
                <Form.Label className="filter-label">Mes</Form.Label>
                <Form.Select
                  value={mesReporte2}
                  onChange={(e) => setMesReporte2(+e.target.value)}
                  className="custom-select"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {mesOptions[i + 1]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Button
                className="export-button"
                onClick={() =>
                  exportToExcel(
                    sortedPlantaData,
                    columnsPlanta,
                    sortedMoviminData,
                    columnsMovimin
                  )
                }
              >
                Exportar a Excel
              </Button>
            </Form>
          </div>

          {isLoadingReporte2 ? (
            <p>Cargando datos de Mina vs Planta...</p>
          ) : (
            <Row className="mb-5">
              {/* Planta */}
              <Col lg={6}>
                <Card className="dashboard-card">
                  <Card.Body>
                    <Card.Title className="dashboard-card-title">
                      Planta
                    </Card.Title>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Tonelaje Total</span>
                        <span className="summary-value">
                          {fmt(plantaTotals.totalTon)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">CuT Promedio</span>
                        <span className="summary-value">
                          {(plantaTotals.avgCuT ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">CuS Promedio</span>
                        <span className="summary-value">
                          {(plantaTotals.avgCuS ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">AsT Promedio</span>
                        <span className="summary-value">
                          {(plantaTotals.avgAsT ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">MoT Promedio</span>
                        <span className="summary-value">
                          {(plantaTotals.avgMoT ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">FeT Promedio</span>
                        <span className="summary-value">
                          {(plantaTotals.avgFeT ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">rcu Promedio</span>
                        <span className="summary-value">
                          {(plantaTotals.avgRcu ?? 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                    <div className="table-container">
                      <DataTable
                        columns={columnsPlanta}
                        data={sortedPlantaData}
                        pagination
                        striped
                        highlightOnHover
                        responsive
                        noDataComponent={
                          <p className="no-data">No hay datos disponibles.</p>
                        }
                        paginationPerPage={30}
                        paginationRowsPerPageOptions={[10, 20, 30, 50]}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6}>
                <Card className="dashboard-card">
                  <Card.Body>
                    <Card.Title className="dashboard-card-title">
                      Movimin
                    </Card.Title>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Tonelaje Total</span>
                        <span className="summary-value">
                          {fmt(moviminTotals.totalTon)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">CuT Promedio</span>
                        <span className="summary-value">
                          {(moviminTotals.avgCut ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">CuS Promedio</span>
                        <span className="summary-value">
                          {(moviminTotals.avgCus ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">AsT Promedio</span>
                        <span className="summary-value">
                          {(moviminTotals.avgAst ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">MoT Promedio</span>
                        <span className="summary-value">
                          {(moviminTotals.avgMot ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">FeT Promedio</span>
                        <span className="summary-value">
                          {(moviminTotals.avgFet ?? 0).toFixed(3)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">rcu Promedio</span>
                        <span className="summary-value">
                          {isNaN(moviminTotals.avgRecGlob)
                            ? "N/A"
                            : (moviminTotals.avgRecGlob ?? 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                    <div className="table-container">
                      <DataTable
                        columns={columnsMovimin}
                        data={sortedMoviminData}
                        pagination
                        striped
                        highlightOnHover
                        responsive
                        noDataComponent={
                          <p className="no-data">No hay datos disponibles.</p>
                        }
                        paginationPerPage={30}
                        paginationRowsPerPageOptions={[10, 20, 30, 50]}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={12}>
                <Card className="dashboard-card">
                  <Card.Body>
                    <Card.Title className="dashboard-card-title">
                      Comparación de Tonelaje y CuT: Mina vs Planta (
                      {mesOptions[mesReporte2]} {añoReporte2})
                    </Card.Title>
                    <div className="chart-container">
                      <Line
                        data={{
                          labels: fechasReporte3,
                          datasets: [
                            {
                              label: "Tonelaje Planta",
                              data: tonPlanta,
                              type: "bar",
                              backgroundColor: "rgba(30,136,229,0.5)",
                              borderColor: "#1e88e5",
                              borderWidth: 1,
                              yAxisID: "y",
                              barThickness: 15,
                            },
                            {
                              label: "Tonelaje Movimin",
                              data: tonMovimin,
                              type: "bar",
                              backgroundColor: "rgba(255,112,67,0.5)",
                              borderColor: "#ff7043",
                              borderWidth: 1,
                              yAxisID: "y",
                              barThickness: 15,
                            },
                            {
                              label: "CuT Planta",
                              data: cutPlanta,
                              type: "line",
                              borderColor: "#1e88e5",
                              backgroundColor: "rgba(30,136,229,0.2)",
                              tension: 0.3,
                              yAxisID: "y1",
                              pointRadius: 3,
                            },
                            {
                              label: "CuT Movimin",
                              data: cutMovimin,
                              type: "line",
                              borderColor: "#ff7043",
                              backgroundColor: "rgba(255,112,67,0.2)",
                              tension: 0.3,
                              yAxisID: "y1",
                              pointRadius: 3,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              position: "left",
                              title: {
                                display: true,
                                text: "Tonelaje",
                                color: "#004d7a",
                              },
                              suggestedMax:
                                Math.max(...tonPlanta, ...tonMovimin, 0) *
                                1.2 || 1000,
                            },
                            y1: {
                              beginAtZero: true,
                              position: "right",
                              title: {
                                display: true,
                                text: "CuT",
                                color: "#004d7a",
                              },
                              grid: { drawOnChartArea: false },
                              suggestedMax:
                                Math.max(...cutPlanta, ...cutMovimin, 0) *
                                1.2 || 1,
                            },
                            x: {
                              grid: { color: "rgba(0,77,122,0.1)" },
                              barPercentage: 0.8,
                              categoryPercentage: 0.9,
                              ticks: {
                                autoSkip: true,
                                maxTicksLimit: 15,
                                maxRotation: 45,
                                minRotation: 45,
                              },
                            },
                          },
                          plugins: {
                            legend: { position: "top" },
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  let label = context.dataset.label || "";
                                  if (label.includes("Tonelaje")) {
                                    return `${label}: ${context.parsed.y.toLocaleString()} ton`;
                                  }
                                  return `${label}: ${context.parsed.y.toFixed(
                                    3
                                  )}`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}
