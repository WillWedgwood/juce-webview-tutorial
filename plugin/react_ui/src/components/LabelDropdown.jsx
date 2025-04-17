import { Listbox } from '@headlessui/react';
import '../styles/components/label-dropdown.css'; // Ensure styles are applied

export const LabelDropdown = ({ labels, removedLabels, setRemovedLabels }) => {
  // Compute enabled labels by excluding removed labels
  const enabledLabels = labels.filter(label => !removedLabels.includes(label));

  // Handle toggling of labels
  const toggleLabel = (label) => {
    if (removedLabels.includes(label)) {
      // Enable the label by removing it from removedLabels
      setRemovedLabels(removedLabels.filter(l => l !== label));
    } else {
      // Disable the label by adding it to removedLabels
      setRemovedLabels([...removedLabels, label]);
    }
  };

  return (
    <div className="dropdown-container">
      <Listbox value={enabledLabels} onChange={() => {}} multiple>
        <Listbox.Button className="dropdown-button">Select Enabled Classifications</Listbox.Button>
        <Listbox.Options className="dropdown-options">
          {labels.map(label => (
            <Listbox.Option key={label} value={label}>
              {({ selected }) => (
                <span
                  className={`dropdown-item ${enabledLabels.includes(label) ? 'selected' : ''}`}
                  onClick={() => toggleLabel(label)}
                >
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