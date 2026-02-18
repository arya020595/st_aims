import React, { useRef, useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/my";
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
import { motion, AnimatePresence } from "framer-motion";

const EditableTime = ({ children, loading, disabled, className, onBlur }) => {
  const input = useRef();
  const [mode, setMode] = useState("VIEW");
  const [time, setTime] = useState(dayjs().format("HH:mm"));
  // console.log({ children, time });

  useEffect(() => {
    if (!children) {
      setTime(dayjs().format("HH:mm"));
    } else if (typeof children === "string") {
      setTime(children);
    } else if (children && typeof children !== "string") {
      console.warn("Children must be string!");
    }
  }, [children]);
  useEffect(() => {
    if (mode === "CLICK_EDIT") {
      setMode("EDIT");
    } else if (mode === "EDIT") {
      input.current.focus();
    }
  }, [mode]);

  const handleSave = useCallback((e) => {
    if (e) e.preventDefault();
    let value = time;
    if (!value) {
      setTime(children);
    } else if (onBlur) {
      // onBlur(e);
      onBlur({
        target: {
          value,
        },
      });
    }
    setMode("VIEW");
  });

  return (
    <span className="inline-block">
      <span
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
                setTimeout(() => {
                  input.current.focus();
                }, 0);
              }
        }
      >
        {time}
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
                className="fa fa-fw fa-save opacity-25"
                style={{ fontSize: "85%" }}
              />
            </a>
          ) : null}
        </>
      )}
      <span className="relative block z-10">
        <AnimatePresence>
          {mode === "EDIT" ? (
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
              className="absolute top-0 left-0 z-10"
            >
              <div className="bg-white shadow-lg rounded px-4 py-2 border border-gray-300">
                <input
                  ref={input}
                  className="outline-none bg-transparent"
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                  }}
                  onBlur={handleSave}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </span>
    </span>
  );
};
export default EditableTime;
