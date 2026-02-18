import React, { useState, useEffect, useRef } from "react";
import {
  useTable,
  useSortBy,
  usePagination,
  useFilters,
  useGlobalFilter,
  useRowSelect,
} from "react-table";
import { matchSorter } from "match-sorter";
import { CSVLink } from "react-csv";
import get from "lodash/get";
import { motion } from "framer-motion";

const Table = ({
  columns,
  data,
  loading,
  onAdd,
  onEdit,
  onRemove,
  customAddButton,
  permanentDelete,
  onRestore,
  contentTrash,
  onGenerate,
  onExport,
  onAddParticipant,
  onRowClick,
  customUtilities,
  customUtilitiesPosition = "right",
  customUtilitiesStyle = {},
  customHeaderButton,
  customHeaderUtilities,
  onChangeSelection,
  csvDownloaderConfig,
  withoutHeader,
  headerColumnColor,
  //
  controlledFilters = [],
  controlledPageIndex,
  controlledPageCount,
  controlledPageSize,
  onPageChange,
}) => {
  // console.log({ controlledFilters });

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  const [filterVisible, setFilterVisible] = useState(
    controlledFilters?.length > 0
  );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );

  // console.log({
  //   controlledPageSize,
  //   controlledPageCount,
  // });
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page, // Instead of using 'rows', we'll use page,
    // which has only the rows for the active page

    state,
    // visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,

    // The rest of these things are super handy, too ;)
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    selectedFlatRows,
    state: { pageIndex, pageSize, selectedRowIds, filters },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: controlledPageIndex || 0,
        pageSize: controlledPageSize || 10,
        filters: controlledFilters || [],
      },
      defaultColumn, // Be sure to pass the defaultColumn option
      filterTypes,
      manualPagination: true,
      autoResetPage: false,
      pageCount: controlledPageCount,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => {
        columns = columns.map((c) => {
          return {
            ...c,
            Header: c.Header.toUpperCase(),
          };
        });
        let finalColumns = [
          // Let's make a column for selection
          {
            id: "selection",
            // The header can use the table's getToggleAllRowsSelectedProps method
            // to render a checkbox
            Header: ({ getToggleAllRowsSelectedProps }) => (
              <div>
                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
              </div>
            ),
            // The cell can use the individual row's getToggleRowSelectedProps method
            // to the render a checkbox
            Cell: ({ row }) => (
              <div>
                <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
              </div>
            ),
          },
          ...columns,
        ];
        if (onEdit || customUtilities || onGenerate || onAddParticipant) {
          if (customUtilitiesPosition === "left") {
            finalColumns = [
              {
                id: "options",
                // The header can use the table's getToggleAllRowsSelectedProps method
                // to render a checkbox
                Header: ({ getToggleAllRowsSelectedProps }) => <div></div>,
                // The cell can use the individual row's getToggleRowSelectedProps method
                // to the render a checkbox
                style: {
                  width: 100,
                  ...customUtilitiesStyle,
                },
                Cell: ({ row }) => (
                  <div>
                    <IndeterminateOptions
                      row={row}
                      onEdit={onEdit}
                      onAddParticipant={onAddParticipant}
                      onGenerate={onGenerate}
                      customUtilities={customUtilities || []}
                    />
                  </div>
                ),
              },
              ...finalColumns,
            ];
          } else {
            finalColumns.push({
              id: "options",
              // The header can use the table's getToggleAllRowsSelectedProps method
              // to render a checkbox
              Header: ({ getToggleAllRowsSelectedProps }) => <div></div>,
              // The cell can use the individual row's getToggleRowSelectedProps method
              // to the render a checkbox
              style: {
                width: 250,
              },
              Cell: ({ row }) => (
                <div>
                  <IndeterminateOptions
                    row={row}
                    onEdit={onEdit}
                    onAddParticipant={onAddParticipant}
                    onGenerate={onGenerate}
                    customUtilities={customUtilities || []}
                  />
                </div>
              ),
            });
          }
        }
        return finalColumns;
      });
    }
  );

  useEffect(() => {
    if (!onChangeSelection) return;
    onChangeSelection({ rows: selectedFlatRows.map((r) => r.original) });
  }, [selectedFlatRows.length]);
  useEffect(() => {
    if (!onPageChange) return;
    // console.log({ pageIndex, pageSize, filters });
    onPageChange({ pageIndex, pageSize, filters });
  }, [onPageChange, pageIndex, pageSize, JSON.stringify(filters)]);

  return (
    <>
      <div className="flex justify-between py-5 px-0 sm:px-5 items-center">
        <div>{customHeaderUtilities}</div>
        <div className="flex">
          {customHeaderButton ? customHeaderButton : null}
          <button
            type="button"
            onClick={(e) => {
              if (e) e.preventDefault();
              setFilterVisible(!filterVisible);
            }}
            className="flex items-center h-9 w-auto py-4 px-2 text-white bg-gray-600 rounded-xl shadow focus:outline-none mr-2"
          >
            <i className="fa fa-filter"></i>
            <p className="text-lg font-bold mx-2">Filter</p>
          </button>
          {onRemove ? (
            <button
              type="button"
              className="flex items-center h-9 w-auto py-4 px-2 text-white bg-red-600 rounded-xl shadow focus:outline-none mr-2"
              disabled={selectedFlatRows.length === 0}
              onClick={(e) => {
                if (e) e.preventDefault();
                if (onRemove) {
                  onRemove({
                    rows: selectedFlatRows.map((r) => r.original),
                  });
                }
              }}
            >
              <i className="fa fa-trash"></i>
              <p className="text-lg font-bold mx-2">Remove</p>
            </button>
          ) : null}
          {onAdd ? (
            <button
              type="button"
              className="flex items-center h-9 w-auto py-4 px-2 text-white bg-green-500 rounded-xl shadow focus:outline-none"
              onClick={onAdd}
            >
              <i className="fa fa-plus" />
              <p className="text-lg font-bold mx-2">Add</p>
            </button>
          ) : null}
        </div>
      </div>
      <div className="rounded-md bg-white flex flex-row shadow-lg flex-wrap text-sm">
        {!withoutHeader ? (
          <div className="px-6 py-4 w-full flex flex-col-reverse sm:flex-row flex-wrap">
            <div className="w-full sm:w-2/3 flex flex-row items-center">
              {customAddButton ? (
                <div className="w-1/2 sm:w-auto px-2 md:px-0 pr-0 md:pr-2">
                  {customAddButton}
                </div>
              ) : null}
              <div className="w-1/2 sm:w-auto px-2 md:px-0 pr-0 md:pr-2">
                <button
                  className={
                    "btn btn-block hover:bg-gray-600 bg-gray-500 py-2 btn-sm" +
                    (filterVisible ? "" : " btn-soft")
                  }
                  type="button"
                  onClick={(e) => {
                    if (e) e.preventDefault();
                    setFilterVisible(!filterVisible);
                  }}
                >
                  <i className="fa fa-filter text-white" /> Filter
                </button>
              </div>
              {csvDownloaderConfig ? (
                <div className="w-1/2 sm:w-auto px-2 md:px-0 pr-0 md:pr-2">
                  <CSVDownloadButton
                    columns={columns}
                    rows={rows}
                    csvDownloaderConfig={csvDownloaderConfig}
                  />
                </div>
              ) : null}

              {onRemove ? (
                <button
                  className="w-1/2 sm:w-auto btn bg-red-500 hover:bg-red-600 py-2 btn-soft btn-sm"
                  disabled={selectedFlatRows.length === 0}
                  onClick={(e) => {
                    if (e) e.preventDefault();
                    if (onRemove) {
                      onRemove({
                        rows: selectedFlatRows.map((r) => r.original),
                      });
                    }
                  }}
                >
                  <i className="fa fa-trash text-white" /> Hapus Terpilih
                </button>
              ) : null}

              {permanentDelete ? (
                <button
                  className="w-1/2 sm:w-auto btn bg-red-500 hover:bg-red-600 py-2 btn-soft btn-sm ml-0"
                  disabled={selectedFlatRows.length === 0}
                  onClick={(e) => {
                    if (e) e.preventDefault();
                    if (permanentDelete) {
                      permanentDelete({
                        rows: selectedFlatRows.map((r) => r.original),
                      });
                    }
                  }}
                >
                  <i className="fa fa-trash text-white" /> Hapus
                </button>
              ) : null}

              {contentTrash ? (
                <a
                  href="/content-trash"
                  className="w-1/2 sm:w-auto btn bg-blue-400 hover:bg-blue-500 py-2 btn-soft btn-sm ml-3"
                  disabled={selectedFlatRows.length === 0}
                >
                  <i className="fas fa-recycle text-white" /> Sampah
                </a>
              ) : null}

              {onRestore ? (
                <button
                  className="w-1/2 sm:w-auto btn bg-blue-400 hover:bg-blue-500 py-2 btn-soft btn-sm ml-3"
                  disabled={selectedFlatRows.length === 0}
                  onClick={(e) => {
                    if (e) e.preventDefault();
                    if (onRestore) {
                      onRestore({
                        rows: selectedFlatRows.map((r) => r.original),
                      });
                    }
                  }}
                >
                  <i className="fas fa-trash-restore text-white" /> Pulihkan
                </button>
              ) : null}
            </div>
            <div className="w-full sm:w-1/3 mb-4 sm:mb-0">
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
                loading={loading}
              />
            </div>
          </div>
        ) : null}

        <div className="w-full overflow-x-auto">
          <table
            {...getTableProps()}
            className="w-full overflow-scroll md:overflow-x-hidden overflow-y-visible bg-blue-100 "
          >
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, index) => {
                    const headerProps = column.getHeaderProps(
                      column.getSortByToggleProps()
                    );

                    return (
                      <th
                        className={
                          "pt-4 pb-3 px-6 font-bolder bg-transparent text-white text-sm text-left border-b bg-custom text-white border-gray-200 " +
                          (column.headerClassName || "")
                        }
                        style={{
                          width:
                            column.id === "selection"
                              ? 20
                              : column.id === "options"
                              ? 50
                              : null,
                          paddingLeft:
                            column.id === "selection"
                              ? 25
                              : column.id === "options"
                              ? 10
                              : 25,
                          paddingRight:
                            column.id === "selection"
                              ? 10
                              : column.id === "options"
                              ? 25
                              : 25,
                          backgroundColor: headerColumnColor
                            ? headerColumnColor
                            : "#74C46F",
                          ...column.style,
                        }}
                        key={headerProps.key}
                      >
                        <div
                          {...headerProps}
                          className="flex flex-row"
                          style={{
                            ...column.style,
                            ...headerProps.style,
                          }}
                        >
                          <div className="whitespace-no-wrap truncate">
                            {column.render("Header")}
                          </div>
                          {column.id === "selection" ||
                          column.id === "options" ||
                          !column.canFilter ? null : (
                            <div className="text-white pl-2">
                              {column.isSorted ? (
                                column.isSortedDesc ? (
                                  <i className="fa fa-sort-down" />
                                ) : (
                                  <i className="fa fa-sort-up" />
                                )
                              ) : (
                                <i className="fa fa-sort" />
                              )}
                            </div>
                          )}
                        </div>
                        {column.canFilter && filterVisible
                          ? column.render("Filter")
                          : null}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody
              {...getTableBodyProps()}
              className={"transition duration-500 " + (loading ? "hidden" : "")}
            >
              {page.map((row, i) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    onClick={(e) => {
                      if (e) {
                        if (
                          e.target.type === "checkbox" &&
                          e.target.title === "Toggle Row Selected"
                        ) {
                        } else if (onRowClick) {
                          e.preventDefault();
                          e.stopPropagation();
                          onRowClick({
                            ...e,
                            row,
                          });
                        }
                      }
                    }}
                    className="transition duration-100 ease-linear border-b border-gray-300 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
                  >
                    {row.cells.map((cell) => {
                      return (
                        <td
                          className="py-5 px-6"
                          {...cell.getCellProps()}
                          style={{
                            width:
                              cell.column.id === "selection"
                                ? 20
                                : cell.column.id === "options"
                                ? 40
                                : null,
                            paddingLeft:
                              cell.column.id === "selection"
                                ? 25
                                : cell.column.id === "options"
                                ? 10
                                : 25,
                            paddingRight:
                              cell.column.id === "selection"
                                ? 10
                                : cell.column.id === "options"
                                ? 25
                                : 25,
                            ...cell.column.style,
                          }}
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {page.length === 0 ? (
          <div className="w-full text-center py-5 text-lg">No Data</div>
        ) : null}
        <div className="relative w-full">
          <div
            className={
              "absolute transition duration-500 bg-white opacity-100 w-full ease-in-out " +
              (loading ? "visible" : "invisible")
            }
          >
            <div className="pt-6 pb-12 text-center">
              <div className="text-xl text-gray-500 text-bold">
                <i className="fa fa-circle-notch fa-spin" /> LOADING ...
              </div>
            </div>
          </div>
          <div className="py-4 px-6 flex flex-row flex-wrap z-0">
            <div className="w-full sm:w-1/3 text-center sm:text-left py-1">
              <label>To Page:</label>
              <input
                className="rounded-md border-2 border-gray-300 ml-2 px-2 py-1 outline-none"
                type="number"
                min="0"
                defaultValue={pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  gotoPage(page);
                }}
                style={{ width: 70 }}
              />
            </div>
            <div className="w-full flex justify-center items-center sm:w-1/3 text-center">
              <button
                className="btn btn-gray px-4 py-1 mr-2 hover:bg-gray-100 text-gray-500 hover:text-white"
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                &nbsp;
                <i
                  className={
                    "fa fa-angle-left " +
                    (canPreviousPage ? "text-white" : "text-gray-300")
                  }
                />
                &nbsp;
              </button>
              <span>
                Page{" "}
                <strong>
                  {pageIndex + 1} of {pageCount}
                </strong>
              </span>
              <button
                className="btn btn-gray px-4 py-1 ml-2 hover:bg-gray-100 text-gray-500 hover:text-white"
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                &nbsp;
                <i
                  className={
                    "fa fa-angle-right " +
                    (canNextPage ? "text-white" : "text-gray-300")
                  }
                />
                &nbsp;
              </button>
            </div>
            <div className="w-full sm:w-1/3 text-center sm:text-right py-1">
              <label>Showing</label>
              &nbsp;
              <span className="rounded-md border-2 border-gray-300 pl-4 pr-2 py-1">
                <select
                  className="outline-none py-1"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                  }}
                >
                  {[10, 20, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize} rows
                    </option>
                  ))}
                </select>
                &#9662;
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Table;

const IndeterminateCheckbox = React.forwardRef(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef();
    const resolvedRef = ref || defaultRef;

    React.useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <div>
        <input type="checkbox" ref={resolvedRef} {...rest} />
      </div>
    );
  }
);

function useOnClickOutside(ref, handler) {
  useEffect(
    () => {
      const listener = (event) => {
        // Do nothing if clicking ref's element or descendent elements
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }

        handler(event);
      };

      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);

      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, handler]
  );
}

const IndeterminateOptions = (props) => {
  const ref = useRef();
  const [optionsVisible, setOptionsVisible] = useState(false);
  useOnClickOutside(ref, () => setOptionsVisible(false));

  // console.log({ optionsVisible });
  return (
    <div className="w-full flex flex-row flex-wrap">
      {props.onEdit ? (
        <button
          onClick={(e) => {
            if (e) e.preventDefault();
            props.onEdit({ row: props.row.original });
            setOptionsVisible(false);
          }}
          className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-1 px-2 text-white focus:outline-none rounded-md"
        >
          <i className="fa fa-pencil-alt text-white" /> Edit
        </button>
      ) : null}
      {props.onGenerate ? (
        <button
          onClick={(e) => {
            if (e) e.preventDefault();
            props.onGenerate({ row: props.row.original });
            setOptionsVisible(false);
          }}
          className="mb-1 bg-green-400 hover:bg-green-500 mx-1 py-1 px-2 text-white focus:outline-none rounded-md"
        >
          <i className="fa fa-code text-white" /> Re-generate
        </button>
      ) : null}
      {props.onAddParticipant ? (
        <button
          onClick={(e) => {
            if (e) e.preventDefault();
            props.onAddParticipant({ row: props.row.original });
            setOptionsVisible(false);
          }}
          className="mb-1 bg-blue-smooth hover-bg-blue-smooth mx-1 py-1 px-2 text-white focus:outline-none rounded-md"
        >
          <i className="fa fa-users text-white" /> Tambah Peserta
        </button>
      ) : null}
      {props.customUtilities.map((utility, index) =>
        utility.render ? (
          <div key={index} className="block hover:bg-gray-100">
            {utility.render(props)}
          </div>
        ) : (
          <a
            key={index}
            className="block px-4 py-2 border-t bg-white hover:bg-gray-100"
            href="#"
            onClick={(e) => {
              if (e) e.preventDefault();
              if (utility.onClick) {
                utility.onClick({ ...e, ...props });
              }
              setOptionsVisible(false);
            }}
          >
            {utility.icon ? <span>{utility.icon} &nbsp;</span> : ""}
            {utility.label}
          </a>
        )
      )}
      {/* <a
        href="#"
        className="px-2 text-gray-500"
        onClick={(e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          setOptionsVisible(!optionsVisible);
        }}
      >
        <i className="fa fa-ellipsis-v" />
      </a> */}
      {/* <div className="flex flex-row-reverse relative" ref={ref}>
        <div
          className={
            "absolute bg-white border border-gray-400 mr-2 rounded text-sm text-gray-700 transition duration-300 ease-in-out z-20 whitespace-no-wrap opacity-100" +
            (optionsVisible ? " block" : " hidden")
          }
        >
          <div className="px-2 py-1 text-xs text-gray-600">
            <b>Utilitas</b>
          </div>
          {props.onEdit ? (
            <a
              className="block px-4 py-2 border-t bg-white hover:bg-gray-100"
              href="#"
              onClick={(e) => {
                if (e) e.preventDefault();
                props.onEdit({ row: props.row.original });
                setOptionsVisible(false);
              }}
            >
              <i className="fa fa-pencil-alt" /> &nbsp; Edit
            </a>
          ) : null}
          
        </div>
      </div> */}
    </div>
  );
};

function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
  loading,
}) {
  const [state, setState] = useState("blur");
  // const count = preGlobalFilteredRows.length;

  return (
    <motion.div
      initial="blur"
      variants={{
        focus: {
          backgroundColor: "rgba(255, 255, 255)",
        },
        blur: {
          backgroundColor: "rgba(242, 244, 245)",
        },
      }}
      animate={state}
      onFocus={(e) => {
        setState("focus");
      }}
      onBlur={(e) => {
        setState("blur");
      }}
      className="rounded-full border-2 border-gray-300 px-2 py-1 flex flex-row"
    >
      <div className="py-1 px-2">
        <i
          className={
            "transition-all duration-500 transform " +
            (state === "focus"
              ? " text-gray-800 scale-100"
              : " text-gray-600 scale-95") +
            " " +
            (!loading ? "fa fa-search" : "fa fa-circle-notch fa-spin")
          }
        />
      </div>
      <input
        className="outline-none py-1 px-1 flex-grow bg-transparent"
        value={globalFilter || ""}
        onChange={(e) => {
          setGlobalFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
        }}
        placeholder={"Penelusuran"}
      />
    </motion.div>
  );
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [(row) => row.values[id]] });
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val) => !val;

function DefaultColumnFilter({ column }) {
  const { filterValue, preFilteredRows, setFilter } = column;
  // const count = preFilteredRows.length;

  return (
    <div>
      <input
        value={filterValue || ""}
        onChange={(e) => {
          setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
        }}
        className={
          "rounded  text-black px-2 mt-1 py-1 w-full outline-none " +
          (column.headerClassName || "")
        }
        placeholder={"Filter " + column.Header}
      />
    </div>
  );
}

const CSVDownloadButton = ({ columns, rows, csvDownloaderConfig }) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const newData = [
      [...columns.map((column) => column.Header)],
      ...rows.map((row) => {
        return columns.map((column) => {
          let value = get(row.original, column.accessor);
          if (column.csvFormatter) {
            value = column.csvFormatter({
              cell: {
                value: value,
              },
              row: row,
            });
          }
          return value;
        });
      }),
    ];
    setData(newData);
  }, [columns, rows, csvDownloaderConfig]);

  return (
    <CSVLink
      data={data}
      filename={csvDownloaderConfig.filename || "data.csv"}
      target="_blank"
      className={"btn btn-block btn-soft btn-primary py-2 px-4 btn-sm"}
      separator={csvDownloaderConfig.separator || ","}
    >
      <i className="fa fa-download" /> Unduh CSV
    </CSVLink>
  );
};
