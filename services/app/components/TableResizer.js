import React, { useState, useEffect, useRef } from "react";
import {
  useTable,
  useSortBy,
  usePagination,
  useFilters,
  useGlobalFilter,
  useRowSelect,
  useBlockLayout,
  useResizeColumns,
} from "react-table";
import { matchSorter } from "match-sorter";
import { CSVLink } from "react-csv";
import get from "lodash/get";
import { motion } from "framer-motion";

const Table = ({
  columns,
  data,
  loading,
  onRemove,
  customAddButton,
  permanentDelete,
  onRestore,
  contentTrash,
  onGenerate,
  onExport,
  onEdit,
  onAddParticipant,
  onRowClick,
  customUtilities,
  onChangeSelection,
  csvDownloaderConfig,
}) => {
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

  const [filterVisible, setFilterVisible] = useState(false);

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 150,
      maxWidth: 400,
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );

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
    state: { pageIndex, pageSize, selectedRowIds },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
      defaultColumn, // Be sure to pass the defaultColumn option
      filterTypes,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    useBlockLayout,
    useResizeColumns,
    (hooks) => {
      hooks.visibleColumns.push((columns) => {
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
            width: 50,
          },
          ...columns,
        ];
        if (onEdit || customUtilities || onGenerate || onAddParticipant) {
          finalColumns.push({
            id: "options",
            // The header can use the table's getToggleAllRowsSelectedProps method
            // to render a checkbox
            Header: ({ getToggleAllRowsSelectedProps }) => <div></div>,
            // The cell can use the individual row's getToggleRowSelectedProps method
            // to the render a checkbox
            style: {
              width: 120,
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
        return finalColumns;
      });
    }
  );

  if (onChangeSelection) {
    useEffect(() => {
      // if (onChangeSelection) {
      onChangeSelection({ rows: selectedFlatRows.map((r) => r.original) });
      // }
    }, [selectedFlatRows.length]);
  }

  return (
    <div className="rounded-md bg-white flex flex-row shadow-lg flex-wrap text-sm">
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
                  onRemove({ rows: selectedFlatRows.map((r) => r.original) });
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
                  onRestore({ rows: selectedFlatRows.map((r) => r.original) });
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

      <div className="w-full overflow-x-auto">
        <div {...getTableProps()} className="table-resizer">
          <div>
            {headerGroups.map((headerGroup) => (
              <div
                style={{
                  backgroundColor: "#81bb43",
                }}
                className="tr text-white"
                {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map((column, index) => {
                  const headerProps = column.getHeaderProps(
                    column.getSortByToggleProps()
                  );
                  return (
                    <div
                      className={"th" + (column.headerClassName || "")}
                      style={{
                        ...column.style,
                        ...headerProps.style,
                        backgroundColor: "#81bb43",
                      }}
                      key={headerProps.key}
                    >
                      <div
                        {...headerProps}
                        className="flex-row-direction"
                        style={{
                          padding: "0.5rem",
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
                      <div
                        {...column.getResizerProps()}
                        className={`resizer ${
                          column.isResizing ? "isResizing" : ""
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div {...getTableBodyProps()}>
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <div {...row.getRowProps()} className="tr">
                  {row.cells.map((cell) => {
                    if (
                      cell.column.id === "selection" ||
                      cell.column.id === "options"
                    ) {
                      return (
                        <div {...cell.getCellProps()} className="td">
                          {cell.render("Cell")}
                        </div>
                      );
                    } else {
                      return (
                        <div {...cell.getCellProps()} className="td">
                          <div className="whitespace-no-wrap truncate">
                            {cell.render("Cell")}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <div
          className={
            "absolute transition duration-500 bg-white opacity-100 w-full ease-in-out " +
            (loading ? "visible" : "invisible")
          }
        >
          <div className="pt-6 pb-12 text-center">
            <div className="text-xl text-gray-500 text-bold">
              <i className="fa fa-circle-notch fa-spin" /> SEDANG MEMUAT ...
            </div>
          </div>
        </div>
        <div className="py-4 px-6 flex flex-row flex-wrap z-0">
          <div className="w-full sm:w-1/3 text-center sm:text-left py-1">
            <label>Menuju halaman:</label>
            <input
              className="rounded-md border-2 border-gray-300 ml-2 px-2 py-1 outline-none"
              type="number"
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
              className="px-4 py-1 mr-2 hover:bg-gray-100"
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
            >
              &nbsp;
              <i
                className={
                  "fa fa-angle-left " +
                  (canPreviousPage ? "text-gray-500" : "text-gray-300")
                }
              />
              &nbsp;
            </button>
            <span>
              Halaman
              <strong>
                {pageIndex + 1} dari {pageCount}
              </strong>
            </span>
            <button
              className="px-4 py-1 ml-2 hover:bg-gray-100"
              onClick={() => nextPage()}
              disabled={!canNextPage}
            >
              &nbsp;
              <i
                className={
                  "fa fa-angle-right " +
                  (canNextPage ? "text-gray-500" : "text-gray-300")
                }
              />
              &nbsp;
            </button>
          </div>
          <div className="w-full sm:w-1/3 text-center sm:text-right py-1">
            <label>Menampilkan</label>
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
                    {pageSize} baris{" "}
                  </option>
                ))}
              </select>
              &#9662;
            </span>
          </div>
        </div>
      </div>
    </div>
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
          className="mb-1 bg-orange-500 hover:bg-orange-600 mx-1 py-1 px-2 text-gray-900 focus:outline-none rounded-md"
        >
          <i className="fa fa-pencil-alt text-gray-900" /> Edit
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
          <div
            key={index}
            className="block border-t bg-white hover:bg-gray-100"
          >
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
                value,
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
