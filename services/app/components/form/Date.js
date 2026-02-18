import React, { useState } from "react";
import { SingleSelect } from "./SingleSelect";
import DatePicker from "react-datepicker";
import dayjs from "dayjs";
import { ShortText } from "./ShortText";

export const Date = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled,
  //
  dateFormat,
  minDate,
  maxDate,
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

  let dateValue = dayjs(
    value
    // "DD MMMM YYYY"
  );
  if (!value) {
    dateValue = null;
  } else if (dateValue.toString() === "Invalid Date") {
    dateValue = null;
    if (required) {
      validationClassName = "is-invalid";
      invalidMessage = this.props.label + " tidak valid!";
    }
  } else {
    dateValue = dateValue.toDate();
  }

  // console.log({
  //   dateValue,
  //   value,
  // });

  return (
    <div className="py-2">
      {typeof label === "string" || typeof label === "object" ? (
        <label className={`text-base ${disabled ? "text-gray-400" : ""}`}>
          {label} {label && !required && <span className="text-gray-300">(optional)</span>}
        </label>
      ) : null}
      <div className="mt-1">
        <DatePicker
          // dayClassName={
          //   this.props.disabledDays
          //     ? (date) =>
          //         this.props.disabledDays.includes(date.getDay())
          //           ? "react-datepicker-disabled-date"
          //           : undefined
          //     : undefined
          // }
          // peekNextMonth
          showTimeSelect={false}
          // timeFormat="HH:mm"
          // timeIntervals={this.props.timeIntervals || 10}
          // timeCaption="time"
          dateFormat={dateFormat || "dd MMMM yyyy"}
          //
          showMonthDropdown
          showYearDropdown
          locale={id}
          dropdownMode="select"
          selected={dateValue}
          onChange={(e) => {
            const value = dayjs(e).format("YYYY-MM-DD");
            // console.log({ e, value });

            if (onChange) {
              onChange({
                preventDefault: () => {},
                target: {
                  value,
                },
              });
            }
          }}
          maxDate={maxDate}
          minDate={minDate}
          // ###############################################
          disabled={!!disabled}
          required={!!required}
          placeholder={placeholder || ""}
          // ###############################################
          onBlur={(e) => {
            setTouched(true);
          }}
          customInput={
            <DateCustomInput
              label={`${label} ${label && required ? "*" : ""}`}
              disabled={!!disabled}
              required={!!required}
              placeholder={placeholder || ""}
              //
              validationClassName={validationClassName}
              invalidMessage={invalidMessage}
            />
          }
        />
      </div>
    </div>
  );
};

const DateCustomInput = (props) => {
  let {
    value,
    onClick,
    validationClassName,
    invalidMessage,
    disabled,
    required,
  } = props;

  return disabled ? (
    <div>
      <input
        type="text"
        className={`form-control ${validationClassName}`}
        placeholder="Belum memilih tanggal"
        value={value ? value : ""}
        disabled
      />
    </div>
  ) : (
    <div>
      <div
        className={`flex flex-row ${
          validationClassName === "is-invalid" ? "is-date-invalid" : ""
        }`}
      >
        <input
          type="text"
          className={`form-control w-2/3 ${validationClassName}`}
          placeholder="Klik untuk memilih tanggal"
          required={required}
          value={value ? value : ""}
          onClick={onClick}
          style={{
            borderRight: "none",
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
        <div
          className={
            "w-1/3 rounded-r-md btn-outlined overflow-hidden border border-black" +
            (validationClassName === "is-valid"
              ? " bg-success-100 border-success-500"
              : validationClassName === "is-invalid"
              ? " bg-red-100 border-red-400"
              : " bg-gray-100 border-gray-400")
          }
        >
          <button
            className={
              "btn btn-block" +
              (validationClassName === "is-valid"
                ? " btn-success"
                : validationClassName === "is-invalid"
                ? " btn-danger"
                : " btn-secondary") +
              " btn-flat truncate rounded-none"
            }
            type="button"
            style={{
              // borderColor: !validationClassName ? "#b4b9fd" : "",
              borderLeft: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            onClick={onClick}
          >
            <i className="fa fa-calendar-day" />
            &nbsp; Select Tanggal
          </button>
        </div>
      </div>
      <div className="invalid-feedback text-red-500">
        {invalidMessage ? invalidMessage : <span>&nbsp;</span>}
      </div>
    </div>
  );
};

export const DateProps = ({
  onUpdate,
  placeholder,
  dateFormat,
  minDate,
  maxDate,
}) => {
  return (
    <div className="pt-1 pb-32">
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
      <SingleSelect
        label="Format Tanggal"
        options={["dd MMMM yyyy", "dd MMM yyyy", "dd/MM/yyyy"]}
        value={dateFormat || "dd MMMM yyyy"}
        onChange={(e) => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              dateFormat: e.target.value,
            });
          }
        }}
      />
      <div className="md:flex">
        <div className="md:w-1/2 md:pr-4">
          <Date
            label="Tanggal Minimum"
            value={minDate}
            onChange={(e) => {
              if (e) e.preventDefault();
              if (onUpdate) {
                onUpdate({
                  minDate: e.target.value,
                });
              }
            }}
          />
        </div>
        <div className="md:w-1/2 md:pl-4">
          <Date
            label="Tanggal Maksimum"
            value={maxDate}
            onChange={(e) => {
              if (e) e.preventDefault();
              if (onUpdate) {
                onUpdate({
                  maxDate: e.target.value,
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
