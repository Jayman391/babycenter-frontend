import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  selectedValue,
  onChange,
  placeholder = '-- Select an Option --',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleOptionClick = (value: string) => {
    onChange(value);
    setIsOpen(false);
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label || placeholder;

  return (
    <div className="custom-select" ref={ref}>
      <div className="custom-select__selected" onClick={() => setIsOpen(!isOpen)}>
        {selectedLabel}
        <span className="custom-select__arrow">&#9662;</span>
      </div>
      {isOpen && (
        <ul className="custom-select__options">
          {options.map((option) => (
            <li
              key={option.value}
              className="custom-select__option"
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .custom-select {
          position: relative;
          width: 100%;
        }
        .custom-select__selected {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          background-color: #fff;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: black;
        }
        .custom-select__arrow {
          margin-left: 10px;
        }
        .custom-select__options {
          position: absolute;
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #ccc;
          border-radius: 3px;
          background-color: #fff;
          z-index: 1000;
          margin-top: 5px;
        }
        .custom-select__option {
          padding: 8px;
          cursor: pointer;
          color: black;
        }
        .custom-select__option:hover {
          background-color: #f1f1f1;
        }
      `}</style>
    </div>
  );
};
