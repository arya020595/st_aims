import React, { useState, useRef, useEffect, useCallback } from "react";
import { TwitterPicker } from "react-color";
import { motion, AnimatePresence } from "framer-motion";

const ColorInput = ({ value, label, style, onChange, ...props }) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const pickerInputContainer = useRef();
  const pickerInput = useRef();
  const pickerContainer = useRef();

  let inputProps = {
    required: !!props.required,
    disabled: !!props.disabled,
    placeholder: props.placeholder || "",
    autoFocus: !!props.autoFocus,
    autoComplete: props.autoComplete || props.autocomplete || "off",
  };

  useEffect(() => {
    if (!pickerVisible) return;

    const handleClick = (e) => {
      if (
        !pickerContainer.current.contains(e.target) &&
        !pickerInputContainer.current.contains(e.target)
      ) {
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

  const handleSave = useCallback(({ hex }) => {
    let value = hex;
    if (onChange) {
      onChange({
        preventDefault: () => {},
        target: {
          value,
        },
      });
    }
  });

  return (
    <>
      <div
        className="form-group text-regentgray-500 relative"
        ref={pickerInputContainer}
      >
        {label ? (
          <label className="mb-1 block text-regentgray-500">{label}</label>
        ) : null}
        <input
          ref={pickerInput}
          type="text"
          className={`form-control text-base md:text-base pl-8`}
          style={style}
          value={value}
          onChange={(e) => {
            if (e) e.preventDefault();
          }}
          {...inputProps}
          onFocus={(e) => {
            if (e) e.preventDefault();
            setPickerVisible(true);
          }}
        />
        <div
          className="h-4 w-4 absolute bottom-0 left-0 mb-4 ml-3 shadow rounded-sm"
          style={{ backgroundColor: value }}
          onClick={(e) => {
            if (e) e.preventDefault();
            pickerInput.current.focus();
          }}
        />
      </div>
      <div className="relative inline-block z-10" ref={pickerContainer}>
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
              className="absolute top-0 left-0 z-10 -mt-4"
            >
              <TwitterPicker color={value} onChangeComplete={handleSave} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ColorInput;

export const EditableColor = ({
  children,
  loading,
  disabled,
  className,
  onBlur,
}) => {
  const [mode, setMode] = useState("VIEW");
  const [color, setColor] = useState("#fff");
  const pickerInputContainer = useRef();
  const pickerContainer = useRef();

  useEffect(() => {
    if (!children) {
      setColor("#fff");
    } else if (typeof children === "string") {
      setColor(children);
    } else if (children && typeof children !== "string") {
      console.warn("Children must be string!");
    }
  }, [children]);
  useEffect(() => {
    if (mode === "CLICK_EDIT") {
      setMode("EDIT");
    } else if (mode === "EDIT") {
    }
  }, [mode]);

  const handleSave = useCallback(({ hex }) => {
    let value = hex;
    if (!value) {
      setColor(children);
      setMode("VIEW");
    } else if (onBlur) {
      setColor(value);
      onBlur({
        preventDefault: () => {},
        target: {
          value,
        },
      });
    }
  });

  useEffect(() => {
    if (mode !== "EDIT") return;

    const handleClick = (e) => {
      if (
        !pickerContainer.current.contains(e.target) &&
        !pickerInputContainer.current.contains(e.target)
      ) {
        setTimeout(() => {
          setMode("VIEW");
        }, 10);
        return;
      }
      return false;
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [mode]);

  return (
    <span className="inline-block">
      <div className="relative inline-block z-10" ref={pickerContainer}>
        <AnimatePresence>
          {mode === "EDIT" ? (
            <motion.div
              ref={pickerContainer}
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
              className="absolute top-0 left-0 z-10 mt-4"
            >
              <TwitterPicker color={color} onChangeComplete={handleSave} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <span
        ref={pickerInputContainer}
        className={
          (loading ? " opacity-50" : "") +
          (className || "") +
          (!disabled ? " hover:opacity-80 " : "") +
          (mode === "EDIT" ? " underline" : "")
        }
        style={{
          textDecorationStyle: "dashed",
          textDecorationColor: "rgba(0, 0, 0, 0.3)",
        }}
        onClick={
          disabled
            ? null
            : (e) => {
                if (e) e.preventDefault();
                setMode("EDIT");
              }
        }
      >
        {color}
      </span>
      &nbsp;
      {loading ? (
        <span className="pl-1">
          <i
            className="fa fa-fw fa-circle-notch fa-spin"
            style={{ fontSize: "85%" }}
          />
        </span>
      ) : (
        <>
          {mode === "VIEW" && !disabled ? (
            <a
              href="#"
              onClick={(e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                setMode("CLICK_EDIT");
              }}
            >
              <i
                className="pl-1 fa fa-fw fa-pencil-alt opacity-25"
                style={{ fontSize: "85%" }}
              />
            </a>
          ) : null}
          {mode === "EDIT" && !disabled ? (
            <a
              href="#"
              onClick={(e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                setMode("VIEW");
              }}
            >
              <i
                className="fa fa-fw fa-save opacity-25 invisible"
                style={{ fontSize: "85%" }}
              />
            </a>
          ) : null}
        </>
      )}
    </span>
  );
};
