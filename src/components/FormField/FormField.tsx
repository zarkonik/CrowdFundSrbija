import "./FormField.css";

type FormFieldProps = {
  labelName: string;
  placeholder: string;
  inputType: string;
  isTextArea: boolean;
  value: string;
  handleChange: () => void;
  min?: string;
};

const FormField = ({
  labelName,
  placeholder,
  inputType,
  isTextArea,
  value,
  handleChange,
  min,
}: FormFieldProps) => {
  return (
    <label className="form-field">
      {labelName && <span className="form-field-label">{labelName}</span>}
      {isTextArea ? (
        <textarea
          required
          value={value}
          onChange={handleChange}
          rows={10}
          placeholder={placeholder}
          className="form-field-input"
        />
      ) : (
        <input
          required
          value={value}
          onChange={handleChange}
          type={inputType}
          step="0.1"
          min={min}
          placeholder={placeholder}
          className="form-field-input"
        />
      )}
    </label>
  );
};

export default FormField;
