import React, { useState } from "react";

export const ShortText = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled,
  onKeyDown,
  hideFeedbackByDefault = false,
}) => {
  let [touched, setTouched] = useState(false);
  let validationClassName = "";
  let invalidMessage = "";
  if (value) {
    validationClassName = "is-valid";
  } else if (touched && required && !disabled) {
    validationClassName = "is-invalid";
    invalidMessage = `${name || label || "This field"} is required`;
  }
  // console.log({
  //   required,
  //   touched,
  //   disabled,
  //   validationClassName,
  //   invalidMessage,
  // });

  return (
    <div className="py-2">
      {typeof label === "string" || typeof label === "object" ? (
        <label className={`text-base ${disabled ? "text-gray-400" : ""}`}>
          {label}{" "}
          {label && !required && (
            <span className="text-gray-300">(optional)</span>
          )}
        </label>
      ) : null}
      <div className="mt-1">
        <input
          disabled={!!disabled}
          required={!!required}
          placeholder={placeholder || ""}
          // ##########################################
          value={value || ""}
          onChange={onChange || (e => {})}
          onKeyDown={onKeyDown}
          // ##########################################
          onBlur={e => {
            setTouched(true);
          }}
          className={`form-control py-2 ${validationClassName}`}
        />
        {!invalidMessage && hideFeedbackByDefault ? null : (
          <div className="invalid-feedback">
            {invalidMessage ? invalidMessage : `${label} tidak valid!`}
          </div>
        )}
      </div>
    </div>
  );
};

export const ShortTextProps = ({ onUpdate, placeholder }) => {
  return (
    <div className="pt-1 pb-32">
      <ShortText
        label="Placeholder"
        value={placeholder || ""}
        onChange={e => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              placeholder: e.target.value,
            });
          }
        }}
      />
    </div>
  );
};
