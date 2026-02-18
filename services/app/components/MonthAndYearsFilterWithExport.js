import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { SingleSelect } from "./form/SingleSelect";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/client";
import { hideLoadingSpinner, showLoadingSpinner } from "./App";
import { useNotification } from "./Notification";
import dayjs from "dayjs";

const EXPORT = gql`
  mutation exportCollectionDataAsExcel($exportConfig: JSON!) {
    exportCollectionDataAsExcel(exportConfig: $exportConfig)
  }
`;

export const MonthAndYearsFilterWithExport = ({
  label,
  options,
  defaultValue = "",
  onSelect,
  exportConfig = {},
  isDisabled = false,
  controlledValue,
}) => {
  const notification = useNotification();
  const [exportCollectionDataAsExcel] = useMutation(EXPORT);

  const router = useRouter();
  // const [year, setYear] = useState(defaultValue);
  // let years = [
  //   ...new Set(
  //     (router.query.years || "")
  //       .split(",")
  //       .map(year => year.trim())
  //       .filter(year => !!year),
  //   ),
  // ];
  // // if (years.length === 0 && defaultValue) {
  // //   years = [defaultValue];
  // // }

  // let { columns = [], filters = { years }, collectionName = "" } = exportConfig;
  // columns = columns?.map(column => {
  //   return {
  //     Header: columns.Header,
  //     accessor: columns.accessor,
  //   };
  // });
  // console.log({
  //   collectionName,
  //   filters,
  //   columns,
  // });
  return (
    <div>
      <div className="flex flex-row">
        <div className="w-40">
          <label>{label}</label>
          <input
            className="form-control border border-green-500 uppercase"
            type="month"
            // value={router.query.yearMonth}
            value={controlledValue || ""}
            disabled={isDisabled}
            onChange={(e) => {
              if (e) e.preventDefault();
              router.push({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  yearMonth: e.target.value,
                },
              });

              if (onSelect) {
                onSelect(e.target.value);
              }
            }}
          />
        </div>
        <div className="pt-8 pl-3 hidden">
          <button
            type="button"
            onClick={async (e) => {
              if (e) e.preventDefault();
              showLoadingSpinner();
              try {
                let result = await exportCollectionDataAsExcel({
                  variables: {
                    exportConfig,
                  },
                });
                // console.log(result);
                window.location.href = result.data.exportCollectionDataAsExcel;
              } catch (err) {
                notification.handleError(err);
              }
              hideLoadingSpinner();
            }}
            className="btn btn-orange btn-lg shadow-lg border-b-0"
          >
            <i className="fa fa-download" /> Export as Excel
          </button>
        </div>
      </div>
    </div>
  );
};
