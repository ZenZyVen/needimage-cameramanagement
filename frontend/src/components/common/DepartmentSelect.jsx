import React, { useState, useEffect } from 'react';
import { DEPARTMENT_GROUPS, ALL_DEPARTMENTS } from '../../constants/departments';

/**
 * Grouped department selector with custom text input fallback for legacy or specialized roles.
 */
const DepartmentSelect = ({
  value = '',
  onChange,
  name = 'department',
  className = 'form-select',
  required = false
}) => {
  const isPreset = !value || ALL_DEPARTMENTS.includes(value);
  const [customMode, setCustomMode] = useState(!isPreset);

  useEffect(() => {
    if (value && !ALL_DEPARTMENTS.includes(value)) {
      setCustomMode(true);
    } else if (ALL_DEPARTMENTS.includes(value)) {
      setCustomMode(false);
    }
  }, [value]);

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === '__OTHER__') {
      setCustomMode(true);
      if (ALL_DEPARTMENTS.includes(value)) {
        onChange('');
      }
    } else {
      setCustomMode(false);
      onChange(selected);
    }
  };

  return (
    <div>
      <select
        className={className}
        name={customMode ? undefined : name}
        value={customMode ? '__OTHER__' : (value || '')}
        onChange={handleSelectChange}
        required={required && !customMode}
      >
        <option value="">-- Select Department --</option>
        {DEPARTMENT_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="__OTHER__">Other (Custom Department...)</option>
      </select>

      {customMode && (
        <input
          type="text"
          className="form-control mt-2"
          name={name}
          placeholder="Enter custom department name"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </div>
  );
};

export default DepartmentSelect;
