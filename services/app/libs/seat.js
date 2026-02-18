const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const maxAlphaIndex = ALPHA.length * ALPHA.length;

const renderSeatNumber = ({
  rowIndex,
  columnIndex,
  seatRowIndex,
  seatColumnIndex,
  conjunction = "",
  customSeatNaming = "Alphabet for Row",
  // ...props
}) => {
  if (rowIndex === undefined) {
    rowIndex = seatRowIndex;
  }
  if (columnIndex === undefined) {
    columnIndex = seatColumnIndex;
  }
  if (!customSeatNaming) {
    customSeatNaming = "Alphabet for Row";
  }

  // if (props.name === "Jerry") {
  //   console.log({
  //     rowIndex,
  //     columnIndex,
  //     customSeatNaming,
  //   });
  // }

  if (customSeatNaming === "Alphabet for Row") {
    if (rowIndex >= maxAlphaIndex) {
      console.error({
        message: `Error! Maximum supported row index is ${maxAlphaIndex}!`,
      });
      return "";
    }

    let rowChar = "";
    const column = Math.floor(rowIndex / ALPHA.length);
    if (column > 0) {
      rowChar += ALPHA[column - 1];
    }
    const subtractor = column * ALPHA.length;
    const mod = rowIndex - subtractor;
    // console.log({ column, mod });
    rowChar += ALPHA[mod];

    return rowChar + conjunction + (columnIndex + 1);
  } else {
    if (columnIndex >= maxAlphaIndex) {
      console.error({
        message: `Error! Maximum supported column index is ${maxAlphaIndex}!`,
      });
      return "";
    }

    let columnChar = "";
    const column = Math.floor(columnIndex / ALPHA.length);
    if (column > 0) {
      columnChar += ALPHA[column - 1];
    }
    const subtractor = column * ALPHA.length;
    const mod = columnIndex - subtractor;
    // console.log({ column, mod });
    columnChar += ALPHA[mod];

    return columnChar + conjunction + (rowIndex + 1);
  }
};

module.exports = {
  renderSeatNumber,
};

// const test = renderSeatNumber({
//   seatRowIndex: 0,
//   columnIndex: 2,
// });
// console.log({ test });
