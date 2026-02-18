import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShortText } from "./ShortText";
import { TwitterPicker } from "react-color";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_COLOR = "#dddddd";

export const SingleSelect = ({
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
  value,
  onChange,
  //
  renderOption,
  renderValue,
  hideFeedbackByDefault = false,
}) => {
  // console.log(options);
  const [keyword, setKeyword] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  const allOptions = (options || [])
    .map(option => {
      if (typeof option !== "object") {
        return {
          label: option,
          value: option,
          color: DEFAULT_COLOR,
        };
      } else {
        return option;
      }
    })
    .filter(option => {
      if (!keyword) return true;
      return (
        (option.label || option.value)
          ?.toLowerCase()
          .indexOf(keyword.toLowerCase()) >= 0
      );
    });
  // console.log({ allOptions });

  const ref = useRef();
  useEffect(() => {
    if (!searchVisible) return;

    const handleClick = e => {
      if (!ref.current.contains(e.target)) {
        setTimeout(() => {
          setSearchVisible(false);
        }, 10);
        return;
      }
      return false;
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [searchVisible]);

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
      <div className="relative flex flex-col w-full items-center mt-1">
        <a
          href="#"
          onClick={e => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            setSearchVisible(!searchVisible);
          }}
          className={`w-full flex justify-between form-control px-4 py-1 relative ${validationClassName}`}>
          <input
            disabled={!!disabled}
            required={!!required}
            placeholder=""
            value={value || ""}
            onChange={e => {
              if (e) e.preventDefault();
            }}
            style={{
              zIndex: -1,
            }}
            className={`w-full py-1 truncate pr-0 md:pr-10 text-base md:text-md font-light outline-none flex-grow rounded-lg absolute top-0 left-0 right-0 bottom-0`}
          />
          {searchVisible ? (
            <div className="w-full ">
              <input
                autoFocus={true}
                disabled={!!disabled}
                required={!!required}
                placeholder={
                  placeholder
                    ? placeholder
                    : label
                    ? `Select ${name || label}...`
                    : "Type to reveal options..."
                }
                // ##########################################
                value={keyword}
                onChange={e => {
                  if (e) e.preventDefault();
                  const newKeyword = e.target.value;
                  setKeyword(newKeyword);
                }}
                // ##########################################
                onBlur={e => {
                  setTouched(true);
                }}
                className={`w-full py-1 truncate pr-0 md:pr-10 text-base md:text-md font-light outline-none flex-grow rounded-lg`}
              />
            </div>
          ) : value ? (
            <div className="text-gray-800 w-full py-1 truncate pr-8">
              {renderValue ? renderValue(value) : value}
            </div>
          ) : (
            <div className="text-gray-400 w-full py-1">
              {placeholder
                ? placeholder
                : label
                ? `Select ${label}`
                : "Temukan Opsi"}
            </div>
          )}

          <i
            className={`text-gray-500 fa fa-caret-${
              searchVisible ? "up" : "down"
            } py-1 px-4 -mr-4 md:text-lg bg-white`}></i>
        </a>

        {!invalidMessage && hideFeedbackByDefault ? null : (
          <div className="invalid-feedback w-full text-right">
            {invalidMessage ? invalidMessage : `${label} tidak valid!`}
          </div>
        )}

        <div
          className="relative inline w-full"
          style={{ maxHeight: 200 }}
          ref={ref}>
          <AnimatePresence>
            {searchVisible ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: "-10%",
                }}
                animate={{
                  opacity: 1,
                  y: "0%",
                }}
                exit={{
                  opacity: 0,
                  y: "-10%",
                }}
                transition={{ duration: 0.1 }}
                className={`bg-white z-10 overflow-y-auto rounded-lg w-full -mt-2 absolute top-0 border border-gray-200 shadow-lg`}
                style={{
                  maxHeight: 200,
                }}>
                {allOptions.length === 0 ? (
                  <div className="py-4 px-4 text-center text-gray-300 text-base">
                    No options.
                  </div>
                ) : (
                  allOptions.map(option => {
                    return (
                      <a
                        onClick={e => {
                          if (e) e.preventDefault();
                          setSearchVisible(false);
                          if (onChange) {
                            // console.log({ option });
                            onChange({
                              preventDefault: () => {},
                              target: {
                                ...option,
                              },
                            });
                          }
                        }}
                        href="#"
                        key={option.value}
                        className="block hover:opacity-50"
                        style={{
                          backgroundColor: convertHexToRGBA(
                            option?.color || DEFAULT_COLOR,
                            20,
                          ),
                        }}>
                        {renderOption ? (
                          renderOption(option)
                        ) : (
                          <div className="flex py-2 px-4 hover:font-bold hover:text-black text-base">
                            {option.label || option.value}
                          </div>
                        )}
                      </a>
                    );
                  })
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const SingleSelectProps = ({ onUpdate, options }) => {
  const [optionValue, setOptionValue] = useState("");
  const [internalOptions, setInternalOptions] = useState([]);

  useEffect(() => {
    setInternalOptions(options || []);
  }, [options]);

  return (
    <div className="pt-1 pb-16">
      <ShortText
        label={
          !optionValue || optionValue.length < 4
            ? "Add option"
            : "Press enter to add"
        }
        value={optionValue}
        onChange={e => {
          setOptionValue(e.target.value);
        }}
        onKeyDown={e => {
          if (e) {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              let allOptions = internalOptions.filter(
                c => c.value !== optionValue,
              );
              const foundOption = internalOptions.find(
                c => c.value === optionValue,
              );
              if (!foundOption) {
                allOptions.push({
                  value: optionValue,
                  color: DEFAULT_COLOR,
                });
              }
              setInternalOptions(allOptions);
              if (onUpdate) {
                onUpdate({
                  options: allOptions,
                });
                setOptionValue("");
              }
            }
          }
        }}
      />
      <div className="pt-2">
        {internalOptions?.map((option, index) => {
          return (
            <SingleSelectPropsOption
              key={index}
              {...option}
              onChange={newOption => {
                // console.log({ newOption });
                // setInternalOptions(
                //   internalOptions.map((p) =>
                //     p.value !== option.value ? p : newOption
                //   )
                // );
                onUpdate({
                  options: internalOptions.map(p =>
                    p.value !== option.value ? p : newOption,
                  ),
                });
              }}
              onRemove={async e => {
                if (e) e.preventDefault();
                // setInternalOptions(internalOptions.filter((p) => p !== option));
                onUpdate({
                  options: internalOptions.filter(p => p !== option),
                });
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const SingleSelectPropsOption = ({ onRemove, onChange, ...option }) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const handleSave = useCallback(
    ({ hex }) => {
      let value = hex;
      if (onChange) {
        onChange({
          ...option,
          color: value,
        });
      }
    },
    [option],
  );

  const pickerContainer = useRef();
  useEffect(() => {
    if (!pickerVisible) return;

    const handleClick = e => {
      if (!pickerContainer.current.contains(e.target)) {
        setTimeout(() => {
          setPickerVisible(false);
        }, 10);
        return;
      }
      return false;
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [pickerVisible]);

  return (
    <div>
      <div className="py-1 flex items-center">
        <a
          href="#"
          onClick={e => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            setPickerVisible(!pickerVisible);
          }}
          className="h-8 w-8 rounded-full bg-primary-100 flex justify-center items-center"
          style={{
            backgroundColor: convertHexToRGBA(
              option?.color || DEFAULT_COLOR,
              80,
            ),
          }}>
          <i className="fa fa-caret-down"></i>
        </a>
        <div
          className="w-1/2 ml-1 px-2 py-1 rounded"
          style={{
            backgroundColor: convertHexToRGBA(
              option?.color || DEFAULT_COLOR,
              20,
            ),
          }}>
          {option?.value}
        </div>
        <a
          className="mx-2 transition duration-200 hover:bg-red-100 hover:text-red-400 px-2 py-1 rounded-md"
          href="#"
          onClick={onRemove}>
          <i className="fa fa-times" />
        </a>
      </div>
      <div className="relative inline z-10" ref={pickerContainer}>
        <AnimatePresence>
          {pickerVisible ? (
            <motion.div
              initial={{
                opacity: 0,
                y: "-10%",
              }}
              animate={{
                opacity: 1,
                y: "0%",
              }}
              exit={{
                opacity: 0,
                y: "-10%",
              }}
              // transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 z-10">
              <TwitterPicker
                color={option?.color}
                onChangeComplete={handleSave}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

const convertHexToRGBA = (hexCode, opacity) => {
  let hex = hexCode.replace("#", "");

  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${opacity / 100})`;
};
