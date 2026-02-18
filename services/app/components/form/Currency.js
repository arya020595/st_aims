import React, { useState } from "react";
import NumberFormat from "react-number-format";
import { ShortText } from "./ShortText";
import { Number } from "./Number";

export const Currency = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled,
  className,
  //
  currencySymbol = "Rp",
  minValue,
  maxValue,
  decimalPlace = 0,
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
          {label} {label && !required && <span className="text-gray-300">(optional)</span>}
        </label>
      ) : null}
      <div className="mt-1">
        <NumberFormat
          disabled={!!disabled}
          required={!!required}
          placeholder={placeholder || ""}
          // ##########################################
          value={!isNaN(value) ? value : null}
          onValueChange={(valueObject) => {
            const { formattedValue, floatValue } = valueObject;
            // console.log({ valueObject });

            let value = formattedValue;
            if (!isNaN(floatValue)) {
              if (minValue && !isNaN(minValue) && floatValue < minValue) {
                value = String(minValue);
              } else if (maxValue && !isNaN(maxValue) && floatValue > maxValue) {
                value = String(maxValue);
              } else {
                value = String(floatValue);
              }
            } else {
              value = "";
            }
            // console.log(valueObject, value, floatValue);

            if (onChange) {
              onChange({
                preventDefault: () => {},
                target: {
                  value,
                },
              });
            }
          }}
          // ##########################################
          onBlur={(e) => {
            setTouched(true);
          }}
          className={`${
            className ? className : "form-control " + validationClassName
          } py-2`}
          // ##########################################
          thousandSeparator={"."}
          decimalSeparator={","}
          prefix={currencySymbol}
          decimalScale={decimalPlace || 0}
        />
        <div className="invalid-feedback">
          {invalidMessage ? invalidMessage : `${label} tidak valid!`}
        </div>
      </div>
    </div>
  );
};

export const CurrencyProps = ({
  onUpdate,
  placeholder,
  currencySymbol = "Rp",
  minValue,
  maxValue,
  decimalPlace = 0,
}) => {
  return (
    <div className="py-1">
      <ShortText
        label="Placeholder"
        value={placeholder || ""}
        onChange={(e) => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              placeholder: e.target.value,
            });
          }
        }}
      />
      <ShortText
        label="Currency Symbol"
        placeholder={`Contoh "Rp", "$", dan lainnya`}
        value={currencySymbol || ""}
        onChange={(e) => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              currencySymbol: e.target.value,
            });
          }
        }}
      />
      <div className="md:flex">
        <div className="md:w-1/2 md:pr-4">
          <Number
            label="Min Value"
            value={minValue}
            onChange={(e) => {
              if (e) e.preventDefault();
              let value = parseFloat(e.target.value);
              if (onUpdate) {
                onUpdate({
                  minValue: !isNaN(value) ? value : null,
                });
              }
            }}
          />
        </div>
        <div className="md:w-1/2 md:pl-4">
          <Number
            label="Max Value"
            value={maxValue}
            onChange={(e) => {
              if (e) e.preventDefault();
              let value = parseFloat(e.target.value);
              if (onUpdate) {
                onUpdate({
                  maxValue: !isNaN(value) ? value : null,
                });
              }
            }}
          />
        </div>
      </div>

      <Number
        label="Decimal Place"
        value={decimalPlace}
        onChange={(e) => {
          if (e) e.preventDefault();
          let value = parseInt(e.target.value);
          if (onUpdate) {
            onUpdate({
              minValue: !isNaN(value) ? value : null,
            });
          }
        }}
      />
    </div>
  );
};
