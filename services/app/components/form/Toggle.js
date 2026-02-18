import React, { useState } from "react";
import { motion } from "framer-motion";

export const Toggle = ({
  active,
  onChange,
  disabled,
  className,
  activeBackgroundColor,
  inactiveBackgroundColor,
}) => {
  return (
    <motion.a
      href="#"
      onClick={
        disabled
          ? null
          : (e) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            onChange({
              target: {
                active: !active,
                valie: !active,
              },
            });
          }
      }
      className={
        "rounded-full p-1 bg-gray-400 flex flex-row w-7 h-3 relative transition duration-300 hover:opacity-90" +
        (disabled ? " cursor-not-allowed" : "") +
        (className ? " " + className : "")
      }
      initial="inactive"
      animate={disabled || !active ? "inactive" : "active"}
      variants={{
        active: {
          backgroundColor: activeBackgroundColor || "#1dd1a1",
        },
        inactive: {
          backgroundColor: inactiveBackgroundColor || "#ccc",
        },
      }}
    >
      <motion.div
        initial="inactive"
        animate={disabled || !active ? "inactive" : "active"}
        variants={{
          active: {
            x: "150%",
          },
          inactive: {
            x: "0%",
          },
        }}
        className={`absolute left-[-4px] w-4 h-4 leading-none rounded-full shadow top-[-2px] ${!active ? "bg-cornflower-blue-200" : "bg-tulip-tree-500"}`}
      />
    </motion.a>
  );
};

export default Toggle;
