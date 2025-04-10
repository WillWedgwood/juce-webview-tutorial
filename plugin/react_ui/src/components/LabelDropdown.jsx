import { Listbox } from '@headlessui/react';
import '../styles/components/label-dropdown.css'; // Ensure styles are applied

export const LabelDropdown = ({ labels, removedLabels, setRemovedLabels }) => {
  return (
    <div className="dropdown-container">
      <Listbox value={removedLabels} onChange={setRemovedLabels} multiple>
        <Listbox.Button className="dropdown-button">Select Labels to Remove</Listbox.Button>
        <Listbox.Options className="dropdown-options">
          {labels.map(label => (
            <Listbox.Option key={label} value={label}>
              {({ selected }) => (
                <span className={`dropdown-item ${selected ? 'selected' : ''}`}>
                  {label}
                </span>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Listbox>
    </div>
  );
};