import React, { useState } from "react";
import { ShortText } from "./ShortText";

export const Checkbox = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled,
  statement = "",
  checkboxClassName,
}) => {
  let [touched, setTouched] = useState(false);
  let validationClassName = "";
  let invalidMessage = "";
  if (value) {
    // validationClassName = "is-valid";
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
  //   checkboxClassName
  // });

  return (
    <div className="py-2">
      {typeof label === "string" || typeof label === "object" ? (
        <label className={`text-base ${disabled ? "text-gray-400" : ""}`}>
          {label} {label && !required && <span className="text-gray-300">(optional)</span>}
        </label>
      ) : null}
      <a
        href="#"
        className={`text-gray-700 mt-2 flex items-center form-control ${validationClassName} ${checkboxClassName}`}
        onClick={(e) => {
          if (e) e.preventDefault();
          if (onChange) {
            onChange({
              preventDefault: () => { },
              target: {
                checked: !value,
                active: !value,
                value: !value,
              },
            });
          }
        }}
      >
        {value ? (
          <i
            // onClick={(e) => {
            //   if (e) e.preventDefault();
            //   if (onChange) {
            //     onChange({
            //       target: {
            //         checked: false,
            //         active: false,
            //         value: false,
            //       },
            //     });
            //   }
            // }}
            className="text-2xl cursor-pointer text-primary-500 fa fa-check-square"
          ></i>
        ) : (
          <i
            // onClick={(e) => {
            //   if (e) e.preventDefault();
            //   if (onChange) {
            //     onChange({
            //       target: {
            //         checked: true,
            //         active: true,
            //         value: true,
            //       },
            //     });
            //   }
            // }}
            className="text-2xl cursor-pointer far fa-square"
          ></i>
        )}
        &nbsp;
        <div className="pl-2">{statement}</div>
      </a>
      {invalidMessage && (
        <div className="invalid-feedback">
          {invalidMessage ? invalidMessage : `${label} tidak valid!`}
        </div>
      )}
    </div>
  );
};

export const CheckboxProps = ({ onUpdate, placeholder, statement }) => {
  return (
    <div className="pt-1 pb-32">
      <ShortText
        label="Statement"
        placeholder={`Contoh "Ya, saya setuju"`}
        value={statement || ""}
        required
        onChange={(e) => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              statement: e.target.value,
            });
          }
        }}
      />
    </div>
  );
};
