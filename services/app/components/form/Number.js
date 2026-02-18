import React, { useState } from "react";
import NumberFormat from "react-number-format";
import { ShortText } from "./ShortText";
import { SingleSelect } from "./SingleSelect";
import { Toggle } from "./Toggle";

export const Number = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled,
  //
  numberFormat = "Integer",
  minValue,
  maxValue,
  decimalPlace = 0,
  allowNegative = false,
  hideFeedbackByDefault,
}) => {
  let [touched, setTouched] = useState(false);
  let validationClassName = "";
  let invalidMessage = "";
  if (value || value === 0) {
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
        <NumberFormat
          disabled={!!disabled}
          required={!!required}
          placeholder={placeholder || ""}
          // ##########################################
          value={!isNaN(value) ? value : null}
          onValueChange={valueObject => {
            const { formattedValue, floatValue } = valueObject;
            // console.log({ valueObject, maxValue, minValue });

            let value = formattedValue;
            if (!isNaN(floatValue)) {
              if (minValue && !isNaN(minValue) && floatValue < minValue) {
                value = String(minValue);
              } else if (
                maxValue &&
                !isNaN(maxValue) &&
                floatValue > maxValue
              ) {
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
          onBlur={e => {
            setTouched(true);
          }}
          className={`form-control py-2 ${validationClassName}`}
          // ##########################################
          allowNegative={allowNegative}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={numberFormat === "Decimal" ? decimalPlace : 0}
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

export const NumberProps = ({
  onUpdate,
  placeholder,
  numberFormat = "Integer",
  minValue,
  maxValue,
  decimalPlace,
  allowNegative,
}) => {
  return (
    <div className="py-1">
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
      <SingleSelect
        label="Number Format"
        options={["Integer", "Decimal"]}
        value={numberFormat}
        onChange={e => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              numberFormat: e.target.value,
            });
          }
        }}
      />
      <div className="md:flex">
        <div className="md:w-1/2 md:pr-4">
          <Number
            label="Min Value"
            value={minValue}
            onChange={e => {
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
            onChange={e => {
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
        disabled={numberFormat !== "Decimal"}
        value={decimalPlace}
        onChange={e => {
          if (e) e.preventDefault();
          let value = parseInt(e.target.value);
          if (onUpdate) {
            onUpdate({
              minValue: !isNaN(value) ? value : null,
            });
          }
        }}
      />
      <div className="flex items-center mt-2">
        <Toggle
          className="transform scale-75"
          active={!!allowNegative}
          onChange={e => {
            if (e && e.preventDefault) e.preventDefault();
            if (onUpdate) {
              onUpdate({
                allowNegative: e.target.active,
              });
            }
          }}
        />{" "}
        Ijinkan Angka Negatif{" "}
      </div>
    </div>
  );
};
