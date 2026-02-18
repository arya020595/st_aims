import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

const Select = (props) => {
  const spanRef = useRef();
  const inputRef = useRef();

  const [inputWidth, setInputWidth] = useState(0);
  const [innerValue, setInnerValue] = useState("");

  const [options, setOptions] = useState([]);
  useEffect(() => {
    if (options) {
      setOptions(options);
    }
  }, [options]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [optionsVisible, setOptionsVisible] = useState(false);

  let inputProps = {
    required: !!props.required,
    disabled: !!props.disabled,
    autoFocus: !!props.autoFocus,
  };

  let invalidMessage =
    inputProps.required && !inputProps.disabled && !selectedOptions.length
      ? `${props.label} is required`
      : "";

  // console.log({ inputProps, invalidMessage });

  const [internalLoading, setInternalLoading] = useState(false);
  const optionsResolverCallback = useCallback(
    debounce(async (value) => {
      try {
        if (props.optionsResolver) {
          let newOptions = await props.optionsResolver(value);
          // console.log({ newOptions });
          if (newOptions) {
            setOptions(newOptions);
          }
        }
      } catch (err) {
        console.warn("[optionsResolverCallback]", err);
      }
      setInternalLoading(false);
    }, 300),
    []
  );

  return (
    <div className={props.className ? props.className : ""}>
      <div className="form-group">
        <label className={props.disabled ? "text-gray-400" : ""}>
          {props.label} {props.suffix} {/* {props.required ? "*" : ""} */}
        </label>
        <div
          className={
            "form-control text-base pr-8 md:text-base cursor-text relative " +
            (innerValue || optionsVisible
              ? "border-primary-500 "
              : invalidMessage && "is-invalid ")
          }
          onClick={(e) => {
            if (e) e.preventDefault();
            inputRef.current.focus();
            setOptionsVisible(true);
          }}
        >
          {!props.multiple ? (
            <span className="absolute px-3 top-0 left-0 my-2 bg-transparent">
              {innerValue && innerValue.length > 0 ? (
                ""
              ) : selectedOptions && selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <SelectedOption key={option.value} option={option} />
                ))
              ) : props.placeholder ? (
                <span className="text-gray-500">{props.placeholder}</span>
              ) : (
                ""
              )}
            </span>
          ) : selectedOptions && selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <SelectedOption
                multiple={props.multiple}
                key={option.value}
                option={option}
                isActive={innerValue || optionsVisible}
                onDeselect={(e) => {
                  if (e) e.preventDefault();
                  setSelectedOptions((options) =>
                    options.filter((o) => o.value !== option.value)
                  );
                }}
              />
            ))
          ) : null}

          <span
            ref={spanRef}
            onChange={(e) => {}}
            className={
              "absolute top-0 left-0 invisible my-2 bg-transparent " +
              (!props.multiple ? "w-11/12" : "")
            }
          >
            {innerValue}
          </span>

          <input
            ref={inputRef}
            className="outline-none inline bg-transparent"
            value={innerValue}
            style={{
              width: inputWidth + 15,
            }}
            onChange={(e) => {
              if (e) e.preventDefault();
              setInputWidth(spanRef.current.clientWidth);
              setInnerValue(e.target.value);
              if (e.target.value) {
                setOptionsVisible(true);
              } else if (!props.multiple) {
                setSelectedOptions([]);
              }

              if (props.optionsResolver) {
                setInternalLoading(true);
                optionsResolverCallback(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              const key = e.keyCode || e.charCode;
              if (key == 8 || key == 46) {
                setSelectedOptions((options) => {
                  if (!options || options.length === 0) return [];
                  options.pop();
                  return [...options];
                });
              }
            }}
            onFocus={(e) => {
              setOptionsVisible(true);
              if (!props.multiple && selectedOptions[0]) {
                setInnerValue(selectedOptions[0].label);
              }
            }}
            onBlur={(e) => {
              setOptionsVisible(false);
            }}
            {...inputProps}
          />
          <div className="absolute top-0 right-0 text-right py-1 my-1">
            <AnimatePresence>
              {(!props.multiple && innerValue && innerValue.length > 0) ||
              (props.multiple &&
                selectedOptions &&
                selectedOptions.length > 0) ? (
                <motion.a
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  href="#"
                  className="text-gray-500 px-3 py-1"
                  onClick={(e) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    setInnerValue("");
                    setSelectedOptions([]);
                  }}
                >
                  <i className="fa fa-times" />
                </motion.a>
              ) : null}
            </AnimatePresence>
            <a
              href="#"
              className={
                "text-gray-500 px-3 py-1 border-l border-gray-400 " +
                (innerValue || optionsVisible
                  ? ""
                  : invalidMessage
                  ? "invisible"
                  : "")
              }
              onClick={(e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                inputRef.current.focus();
              }}
            >
              {internalLoading ? (
                <i className="fa fa-circle-notch fa-spin" />
              ) : optionsVisible ? (
                <i className="fa fa-chevron-up" />
              ) : (
                <i className="fa fa-chevron-down" />
              )}
            </a>
          </div>
        </div>

        <div className="invalid-feedback">
          {invalidMessage ? invalidMessage : `${props.label} tidak valid!`}
        </div>
      </div>

      <SelectOptions
        visible={optionsVisible}
        options={options}
        currentValue={innerValue}
        loading={internalLoading}
        onSelect={(option) => {
          if (!option) return;

          if (!props.multiple) {
            setSelectedOptions([option]);
            if (props.onChange) {
              props.onChange(option);
            }
            inputRef.current.blur();
            // setOptionsVisible(false);
            setInnerValue("");
          } else {
            const foundOption = selectedOptions.find(
              (o) => o.value === option.value
            );
            // console.log({ foundOption });
            if (!foundOption) {
              setSelectedOptions((options) => {
                const newOptions = [...options, option];
                if (props.onChange) {
                  props.onChange(newOptions);
                }
                return newOptions;
              });
              inputRef.current.focus();
              // setOptionsVisible(false);
              setInnerValue("");
            }
          }
        }}
        customOptionRender={props.customOptionRender}
      />
    </div>
  );
};

export default Select;

const SelectOptions = ({
  visible,
  options,
  currentValue,
  maxHeight = 160,
  onSelect,
  loading,
  customOptionRender,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    const keyword = currentValue.toUpperCase().trim();
    return options
      .map((option) => {
        const isObject = typeof option === "object";
        if (isObject) {
          return {
            ...option,
            value: option.value || "",
            label: option.label || "",
          };
        } else {
          return {
            value: option,
            label: option,
          };
        }
      })
      .filter((option) => {
        if (!currentValue) return true;
        return (
          option.value.toUpperCase().indexOf(keyword) >= 0 ||
          option.label.toUpperCase().indexOf(keyword) >= 0
        );
      });
  }, [currentValue, options.length]);
  // console.log({ filteredOptions });

  // useEffect(() => {
  //   setHoveredIndex(0);
  // }, [filteredOptions.length]);

  useEffect(() => {
    if (!visible) {
      setHoveredIndex(0);
      return;
    }

    const handleKeyDown = (e) => {
      e = e || window.event;
      if (e.key === "ArrowDown") {
        setHoveredIndex(hoveredIndex + 1);
      } else if (e.key === "ArrowUp") {
        let newIndex = hoveredIndex - 1;
        setHoveredIndex(newIndex >= 0 ? newIndex : 0);
      } else if (e.key === "Enter") {
        // console.log(
        //   filteredOptions,
        //   "Enter...",
        //   hoveredIndex,
        //   filteredOptions[hoveredIndex]
        // );
        const selectedOption = filteredOptions[hoveredIndex];
        if (onSelect && selectedOption && !selectedOption.disabled) {
          onSelect(selectedOption);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // return function to be called when unmounted
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, hoveredIndex, filteredOptions]);

  if (!options) return null;

  return (
    <div className="relative">
      <AnimatePresence>
        {visible ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 shadow-lg -mt-4 bg-white rounded-lg overflow-y-scroll z-10"
            style={{
              maxHeight,
            }}
          >
            {loading || filteredOptions.length === 0 ? (
              <a
                href="#"
                className={
                  "text-center text-gray-400 block pt-2 pb-3 px-4 border-b border-gray-200 hover:bg-blue-100 hover:font-semibold"
                }
                onClick={(e) => {
                  if (e) e.preventDefault();
                }}
              >
                {loading ? "Sedang memuat..." : "Tidak ada pilihan."}
              </a>
            ) : (
              filteredOptions.map((option, index) => {
                const { value, label } = option;
                return (
                  <a
                    href="#"
                    key={value}
                    className={
                      "w-full flex py-2 px-4 border-b border-gray-200 " +
                      (hoveredIndex === index
                        ? "bg-blue-100 font-semibold"
                        : "")
                    }
                    onMouseOver={
                      option.disabled
                        ? null
                        : (e) => {
                            if (e) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                            setHoveredIndex(index);
                          }
                    }
                    onClick={
                      option.disabled
                        ? null
                        : (e) => {
                            if (e) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                            if (onSelect) {
                              onSelect(option);
                            }
                          }
                    }
                  >
                    {customOptionRender ? customOptionRender(option) : label}
                  </a>
                );
              })
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const SelectedOption = ({ option, multiple, onDeselect, isActive }) => {
  return (
    <>
      <span
        className={
          multiple
            ? `${
                isActive ? "bg-primary-600" : "bg-gray-500"
              } text-white pl-2 pr-1 text-base py-1 rounded-l-md overflow-hidden`
            : ""
        }
      >
        {option.label}
      </span>
      {multiple ? (
        <a
          href="#"
          className={
            multiple
              ? `${
                  isActive
                    ? "bg-primary-700 hover:bg-primary-800"
                    : "bg-gray-600 hover:bg-gray-700"
                }  transition duration-300 text-white px-2 text-base py-1 rounded-r-md overflow-hidden mr-1`
              : ""
          }
          onClick={(e) => {
            if (e) e.preventDefault();
            if (onDeselect) {
              onDeselect(e);
            }
          }}
        >
          <i className="fa fa-times" />
        </a>
      ) : null}
    </>
  );
};
