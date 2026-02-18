import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";

export const DropDownMenu = ({ componentName, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <div className="block md:hidden">
        <div
          className="bg-mantis-200 text-black font-bold cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4 mb-2"
          onClick={e => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            setVisible(!visible);
          }}>
          <div className="text-xs font-bold">Sub Menu</div>
          <p className="text-lg font-semibold flex justify-between items-center">
            {componentName} <i className="fa fa-caret-down" />
          </p>
        </div>
        <AnimatePresence>
          {visible ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, delay: 0 }}
              className="flex flex-col md:flex-row mx-2">
              {children}
              {/* <div
  className={`${
    router.query.componentName === "Input For PPE"
      ? "bg-mantis-200 text-black font-bold"
      : "bg-white text-black border border-gray-300"
  } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
    ${
      currentUserDontHavePrivilege(["Input For PPE:Read"])
        ? "hidden"
        : "block"
    }
    `}
  onClick={e => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        componentName: "Input For PPE",
      },
    });
  }}>
  <p className="text-lg font-semibold">Input For PPE</p>
</div>
<div
  className={`${
    router.query.componentName === "Input From PKK"
      ? "bg-mantis-200 text-black font-bold"
      : "bg-white text-black border border-gray-300"
  } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
    
    ${
      currentUserDontHavePrivilege(["Input From PKK:Read"])
        ? "hidden"
        : "block"
    }

    `}
  onClick={e => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        componentName: "Input From PKK",
        date: dayjs().format("YYYY-MM-DD"),
      },
    });
  }}>
  <p className="text-lg font-semibold">Input From PKK</p>
</div>
<div
  className={`${
    router.query.componentName === "Daily Report"
      ? "bg-mantis-200 text-black font-bold"
      : "bg-white text-black border border-gray-300"
  } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
    
    ${
      currentUserDontHavePrivilege([
        "Domestic Price Daily Report:Read",
      ])
        ? "hidden"
        : "block"
    }
    
    `}
  onClick={e => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        componentName: "Daily Report",
      },
    });
  }}>
  <p className="text-lg font-semibold">Daily Report</p>
</div>
<div
  className={`${
    router.query.componentName === "Weekly Report"
      ? "bg-mantis-200 text-black font-bold"
      : "bg-white text-black border border-gray-300"
  } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
    
    ${
      currentUserDontHavePrivilege([
        "Domestic Price Weekly Report:Read",
      ])
        ? "hidden"
        : "block"
    }
    `}
  onClick={e => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        componentName: "Weekly Report",
      },
    });
  }}>
  <p className="text-lg font-semibold">Weekly Report</p>
</div>
<div
  className={`${
    router.query.componentName === "Monthly Report"
      ? "bg-mantis-200 text-black font-bold"
      : "bg-white text-black border border-gray-300"
  } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
    
    ${
      currentUserDontHavePrivilege([
        "Domestic Price Monthly Report:Read",
      ])
        ? "hidden"
        : "block"
    }
    `}
  onClick={e => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        componentName: "Monthly Report",
      },
    });
  }}>
  <p className="text-lg font-semibold">Monthly Report</p>
</div>
<div
  className={`${
    router.query.componentName === "Quarterly Report"
      ? "bg-mantis-200 text-black font-bold"
      : "bg-white text-black border border-gray-300"
  } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
    
    ${
      currentUserDontHavePrivilege([
        "Domestic Price Quarterly Report:Read",
      ])
        ? "hidden"
        : "block"
    }
    `}
  onClick={e => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        componentName: "Quarterly Report",
      },
    });
  }}>
  <p className="text-lg font-semibold">Quarterly Report</p>
</div>
<div
  className={`${
    router.query.componentName === "Yearly Report"
      ? "bg-mantis-200 text-black font-bold"
      : "bg-white text-black border border-gray-300"
  } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
    
    ${
      currentUserDontHavePrivilege([
        "Domestic Price Monthly Report:Read",
      ])
        ? "hidden"
        : "block"
    }
    `}
  onClick={e => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        componentName: "Yearly Report",
      },
    });
  }}>
  <p className="text-lg font-semibold">Yearly Report</p>
</div> */}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="hidden md:flex">{children}</div>
    </>
  );
};
