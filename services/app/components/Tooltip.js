import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";

const Tooltip = ({ content, children, size }) => {
  // console.log({ size });
  const tooltipRef = useRef(null);

  // useEffect(() => {
  //   const tooltipWidth = tooltipRef.current.offsetWidth;
  //   console.log({ tooltipWidth });
  //   tooltipRef.current.style.width = `${tooltipWidth}px`;
  // }, [content]);

  return (
    <div className="relative inline-block">
      <div className="group">
        {children}
        <div
          // ref={tooltipRef}
          className={`w-${size} opacity-0 invisible group-hover:opacity-100 group-hover:visible absolute z-50 transition-all duration-300 ease-in-out bg-gray-700 text-white text-sm px-2 py-1 rounded-md`}
        >
          {content}
          <div className="arrow"></div>
        </div>
      </div>
    </div>
  );
};

Tooltip.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Tooltip;
