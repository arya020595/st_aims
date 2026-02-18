import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const HorizontalScroller = ({ children }) => {
  const scroller = useRef();
  const [rightScrollHelperVisible, setRightScrollHelperVisible] = useState(
    false
  );
  const [leftScrollHelperVisible, setLeftScrollHelperVisible] = useState(false);
  useEffect(() => {
    // console.log(scroller.current.offsetWidth, scroller.current.scrollWidth);
    if (scroller.current.scrollWidth > scroller.current.offsetWidth) {
      setRightScrollHelperVisible(true);
    }
    if (scroller.current.scrollWidth < scroller.current.offsetWidth) {
      setLeftScrollHelperVisible(true);
    }
  }, []);

  return (
    <div className="relative">
      <div
        className="overflow-x-scroll pt-2 pb-2 no-scrollbar whitespace-nowrap"
        ref={scroller}
        style={{
          scrollBehavior: "smooth",
        }}
        onScroll={(e) => {
          if (e) e.preventDefault();
          const scroller = e.target;
          const scrollPosition = scroller.offsetWidth + scroller.scrollLeft;
          // console.log(
          //   scroller.offsetWidth,
          //   scroller.scrollLeft,
          //   scrollPosition,
          //   scroller.scrollWidth
          // );
          if (scrollPosition >= scroller.scrollWidth - 20) {
            setRightScrollHelperVisible(false);
          } else {
            setRightScrollHelperVisible(true);
          }

          if (scrollPosition <= scroller.offsetWidth + 20) {
            setLeftScrollHelperVisible(false);
          } else {
            setLeftScrollHelperVisible(true);
          }
        }}
      >
        {children}
      </div>
      <AnimatePresence>
        {leftScrollHelperVisible && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            className="absolute transform scale-75 left-0 top-0 bottom-0 flex flex-col justify-center px-2"
          >
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-gray-200 text-black flex flex-col justify-center items-center border border-gray-200"
              onClick={(e) => {
                if (e) e.preventDefault();
                scroller.current.scrollLeft -=
                  scroller.current.offsetWidth * 0.5;
                // const scrollPosition =
                //   scroller.current.offsetWidth + scroller.current.scrollLeft;
                // console.log(
                //   scroller.current.offsetWidth,
                //   scroller.current.scrollLeft,
                //   scrollPosition,
                //   scroller.current.scrollWidth
                // );
              }}
            >
              <i className="fa fa-chevron-left text-primary-500 text-lg" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rightScrollHelperVisible && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            className="absolute transform scale-75 right-0 top-0 bottom-0 flex flex-col justify-center px-2"
          >
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-gray-200 text-black flex flex-col justify-center items-center border border-gray-200"
              onClick={(e) => {
                if (e) e.preventDefault();
                scroller.current.scrollLeft +=
                  scroller.current.offsetWidth * 0.5;
                // const scrollPosition =
                //   scroller.current.offsetWidth + scroller.current.scrollLeft;
                // console.log(
                //   scroller.current.offsetWidth,
                //   scroller.current.scrollLeft,
                //   scrollPosition,
                //   scroller.current.scrollWidth
                // );
              }}
            >
              <i className="fa fa-chevron-right text-primary-500 text-lg" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ScrolledComponent = ({ children, width, padding }) => {
  return (
    <div className={`inline-block ${padding || "px-1"} ${width}`}>
      {children}
    </div>
  );
};
