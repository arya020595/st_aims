import React, { useState } from "react";
import { ShortText } from "./ShortText";
import { Number } from "./Number";

export const OpinionScale = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled,
  //
  minScale,
  maxScale,
  leftLabel,
  rightLabel,
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

  let scaleRange = maxScale - minScale + 1;
  if (scaleRange < 0) {
    scaleRange = 0;
  }
  // console.log({
  //   scaleRange,
  //   maxScale,
  //   minScale,
  // });

  return (
    <div className="py-2">
      {typeof label === "string" || typeof label === "object" ? (
        <label className={`text-base ${disabled ? "text-gray-400" : ""}`}>
          {label} {label && !required && <span className="text-gray-300">(optional)</span>}
        </label>
      ) : null}
      <div className="flex mt-4 mb-2 w-full rounded-lg border border-gray-400 overflow-hidden">
        {[...Array(scaleRange || 5).keys()].map((index) => {
          let scaleValue = minScale + index;

          return (
            <div
              onClick={(e) => {
                if (e) e.preventDefault();
                if (onChange) {
                  onChange({
                    preventDefault: () => {},
                    target: {
                      value: scaleValue,
                    },
                  });
                }
              }}
              className={`border flex justify-center flex-grow py-1 px-3 ${
                scaleRange > 8 ? "text-base" : "text-md"
              } cursor-pointer ${
                value === scaleValue
                  ? "bg-primary-100 text-primary-600 border-primary-500"
                  : "border-gray-400"
              }`}
            >
              {scaleValue}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        <div className="text-base">{leftLabel}</div>
        <div className="text-base">{rightLabel}</div>
      </div>
      <div className="invalid-feedback">
        {invalidMessage ? invalidMessage : `${label} tidak valid!`}
      </div>
    </div>
  );
};

export const OpinionScaleProps = ({
  onUpdate,
  placeholder,
  minScale = 0,
  maxScale = 10,
  leftLabel = "",
  rightLabel = "",
}) => {
  return (
    <div className="py-1">
      <div className="md:flex items-center">
        <div className="md:w-5/12">
          <Number
            required
            label="Min Scale"
            // minValue={0}
            // maxValue={maxScale - 1}
            value={minScale}
            onChange={(e) => {
              if (e) e.preventDefault();
              let value = parseFloat(e.target.value);
              if (onUpdate) {
                onUpdate({
                  minScale: !isNaN(value) ? value : null,
                });
              }
            }}
          />
        </div>
        <div className="hidden md:block md:w-2/12 px-2 pt-2 text-base text-center">
          Sampai
        </div>
        <div className="md:w-5/12">
          <Number
            required
            label="Max Scale"
            // minValue={minScale + 1}
            // maxValue={minScale + 5}
            value={maxScale}
            onChange={(e) => {
              if (e) e.preventDefault();
              let value = parseFloat(e.target.value);
              if (onUpdate) {
                onUpdate({
                  maxScale: !isNaN(value) ? value : null,
                });
              }
            }}
          />
        </div>
      </div>

      <ShortText
        label="Label Kiri"
        required
        value={leftLabel}
        onChange={(e) => {
          if (e) e.preventDefault();
          let value = parseFloat(e.target.value);
          if (onUpdate) {
            onUpdate({
              leftLabel: e.target.value,
            });
          }
        }}
      />
      <ShortText
        label="Label Kanan"
        required
        value={rightLabel}
        onChange={(e) => {
          if (e) e.preventDefault();
          let value = parseFloat(e.target.value);
          if (onUpdate) {
            onUpdate({
              rightLabel: e.target.value,
            });
          }
        }}
      />
    </div>
  );
};
