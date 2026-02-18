import React, { useState } from "react";
import { SingleSelect } from "./SingleSelect";

export const Rating = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled,
  //
  maxScale,
  ratingIcon,
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

  // console.log({ maxScale, ratingIcon });

  return (
    <div className="py-2">
      {typeof label === "string" || typeof label === "object" ? (
        <label className={`text-base ${disabled ? "text-gray-400" : ""}`}>
          {label} {label && !required && <span className="text-gray-300">(optional)</span>}
        </label>
      ) : null}
      <div className="flex my-4">
        {[...Array(maxScale || 5).keys()].map((index) => {
          let rating = index + 1;
          return (
            <i
              onClick={(e) => {
                if (e) e.preventDefault();
                if (onChange) {
                  onChange({
                    preventDefault: () => {},
                    target: {
                      value: rating,
                    },
                  });
                }
              }}
              className={`fa fa-${ratingIcon} cursor-pointer w-10 md:w-20 text-2xl md:text-5xl mr-1 md:mr-3 ${
                value >= rating ? "text-orange-500" : "text-gray-300"
              }`}
            ></i>
          );
        })}
      </div>
      <div className="invalid-feedback">
        {invalidMessage ? invalidMessage : `${label} tidak valid!`}
      </div>
    </div>
  );
};

export const RatingProps = ({
  onUpdate,
  placeholder,
  ratingIcon,
  maxScale,
}) => {
  const OPTION_MAPS = [
    {
      icon: "star",
      name: "Bintang",
    },
    {
      icon: "thumbs-up",
      name: "Jempol",
    },
    {
      icon: "heart",
      name: "Hati",
    },
    {
      icon: "trophy",
      name: "Trophy",
    },
  ];

  return (
    <div className="pt-1 pb-32">
      <div className="md:flex items-center">
        <div className="md:w-1/2 md:pr-4">
          <SingleSelect
            label="Ikon"
            options={["star", "thumbs-up", "heart", "trophy"]}
            renderOption={(option) => {
              let selectedOption = OPTION_MAPS.find((o) => o.icon === option);
              return (
                <span>
                  <i className={`fa fa-${selectedOption?.icon}`} />{" "}
                  {selectedOption?.name || ""}
                </span>
              );
            }}
            required
            value={ratingIcon}
            onChange={(e) => {
              if (e) e.preventDefault();
              if (onUpdate) {
                onUpdate({
                  ratingIcon: e.target.value,
                });
              }
            }}
          />
        </div>

        <div className="md:w-1/2 md:pl-4">
          <SingleSelect
            label="Max Scale"
            options={[3, 5]}
            required
            value={maxScale}
            onChange={(e) => {
              if (e) e.preventDefault();
              if (onUpdate) {
                onUpdate({
                  maxScale: e.target.value,
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
