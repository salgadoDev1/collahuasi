import React, { useState, useEffect, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import "./MultiSelect.css";

const MultiSelect = ({
  options,
  selectedItems,
  onSelectionChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (option, isChecked) => {
    const updatedSelection = { ...selectedItems, [option.id]: isChecked };
    onSelectionChange(updatedSelection);
  };

  const selectAll = () => {
    const allSelected = options.reduce(
      (acc, opt) => ({ ...acc, [opt.id]: true }),
      {}
    );
    onSelectionChange(allSelected);
  };

  const clearAll = () => {
    const allCleared = options.reduce(
      (acc, opt) => ({ ...acc, [opt.id]: false }),
      {}
    );
    onSelectionChange(allCleared);
  };

  const getButtonText = () => {
    const count = Object.values(selectedItems).filter(Boolean).length;
    if (count === 0) return placeholder || "Selecciona columnas...";
    return `${count} columna${count === 1 ? "" : "s"} seleccionada${
      count === 1 ? "" : "s"
    }`;
  };

  return (
    <div className="multi-select-container" ref={containerRef}>
      <div className="multi-select-header">
        <Button
          variant="outline-secondary"
          className="w-100 d-flex justify-content-between align-items-center multi-select-button"
          onClick={toggleDropdown}
        >
          <span>{getButtonText()}</span>
          <span className={`arrow ${isOpen ? "open" : ""}`}>
            {isOpen ? "▲" : "▼"}
          </span>
        </Button>
      </div>
      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-controls">
            <button className="btn-select-all" onClick={selectAll}>
              Seleccionar
            </button>
            <button className="btn-clear-all" onClick={clearAll}>
              Limpiar
            </button>
          </div>
          <div className="multi-select-options">
            {options.map((option) => (
              <Form.Check
                key={option.id}
                id={option.id}
                type="checkbox"
                label={option.name.replace("Sum ", "")}
                checked={!!selectedItems[option.id]}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                className="multi-select-option"
                style={{ borderLeft: `3px solid ${option.color}` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
