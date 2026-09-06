const normalizeRow = (row) => row?.trim?.().toUpperCase?.() || "";

const ROW_LABEL_PATTERN = /^[A-Z]+$/;

const buildSeatNumber = ({ row, column }) => {
  const normalizedRow = normalizeRow(row);
  return normalizedRow && column ? `${normalizedRow}${column}` : "";
};

const parseExcludedColumns = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);
  }

  if (!value?.trim?.()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
};

const parseSequentialExcludedColumns = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const column = Number(item);
      if (!Number.isInteger(column) || column <= 0) {
        throw new Error("Excluded columns must be positive integers");
      }
      return column;
    });
  }

  if (!value?.trim?.()) {
    return [];
  }

  return value.split(",").map((item) => {
    const column = Number(item.trim());
    if (!Number.isInteger(column) || column <= 0) {
      throw new Error("Excluded columns must be positive integers");
    }
    return column;
  });
};

const countPreviewSeats = (rows = []) => rows.reduce((sum, row) => {
  const startColumn = Number(row?.startColumn);
  const endColumn = Number(row?.endColumn);
  if (!Number.isInteger(startColumn) || !Number.isInteger(endColumn) || startColumn <= 0 || endColumn < startColumn) {
    return sum;
  }

  const excluded = new Set(parseExcludedColumns(row.excludedColumns));
  let count = 0;
  for (let column = startColumn; column <= endColumn; column += 1) {
    if (!excluded.has(column)) {
      count += 1;
    }
  }
  return sum + count;
}, 0);

const rowLabelToNumber = (rowLabel) => {
  const normalizedRow = normalizeRow(rowLabel);
  if (!ROW_LABEL_PATTERN.test(normalizedRow)) {
    throw new Error("Invalid row label");
  }

  return normalizedRow.split("").reduce((value, character) => (
    value * 26 + character.charCodeAt(0) - 64
  ), 0);
};

const numberToRowLabel = (rowNumber) => {
  if (!Number.isInteger(rowNumber) || rowNumber <= 0) {
    throw new Error("Invalid row number");
  }

  let value = rowNumber;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
};

const normalizeSequentialSeatInput = ({
  startingRow,
  numberOfRows,
  seatsPerRow,
  seatType = "STANDARD",
  excludedColumns = "",
} = {}) => {
  const normalizedStartingRow = normalizeRow(startingRow);
  const normalizedNumberOfRows = Number(numberOfRows);
  const normalizedSeatsPerRow = Number(seatsPerRow);
  const normalizedSeatType = normalizeRow(seatType);
  const parsedExcludedColumns = parseSequentialExcludedColumns(excludedColumns);

  if (!ROW_LABEL_PATTERN.test(normalizedStartingRow)) {
    throw new Error("Starting row must contain letters only");
  }
  if (!Number.isInteger(normalizedNumberOfRows) || normalizedNumberOfRows <= 0) {
    throw new Error("Number of rows must be a positive integer");
  }
  if (!Number.isInteger(normalizedSeatsPerRow) || normalizedSeatsPerRow <= 0) {
    throw new Error("Seats per row must be a positive integer");
  }
  if (parsedExcludedColumns.some((column) => column > normalizedSeatsPerRow)) {
    throw new Error("Excluded columns must be inside the row range");
  }

  return {
    startingRow: normalizedStartingRow,
    numberOfRows: normalizedNumberOfRows,
    seatsPerRow: normalizedSeatsPerRow,
    seatType: normalizedSeatType,
    excludedColumns: parsedExcludedColumns,
  };
};

const generateSequentialRows = (input = {}) => {
  const normalizedInput = normalizeSequentialSeatInput(input);
  const startingRowNumber = rowLabelToNumber(normalizedInput.startingRow);

  return Array.from({ length: normalizedInput.numberOfRows }, (_, index) => ({
    row: numberToRowLabel(startingRowNumber + index),
    startColumn: 1,
    endColumn: normalizedInput.seatsPerRow,
    seatType: normalizedInput.seatType,
    excludedColumns: normalizedInput.excludedColumns,
  }));
};

const getSequentialSeatPreview = (input = {}, { activeSeatCount = 0, capacity = 0 } = {}) => {
  try {
    const rows = generateSequentialRows(input);
    const normalizedInput = normalizeSequentialSeatInput(input);
    const startingRowNumber = rowLabelToNumber(normalizedInput.startingRow);
    const endingRow = numberToRowLabel(startingRowNumber + normalizedInput.numberOfRows - 1);
    const seatsToCreate = countPreviewSeats(rows);
    const afterCreation = activeSeatCount + seatsToCreate;

    return {
      isValid: true,
      rows,
      startingRow: normalizedInput.startingRow,
      endingRow,
      numberOfRows: normalizedInput.numberOfRows,
      seatsPerRow: normalizedInput.seatsPerRow,
      excludedPerRow: normalizedInput.excludedColumns.length,
      seatsToCreate,
      afterCreation,
      remaining: Math.max(capacity - afterCreation, 0),
      layoutStatus: afterCreation === capacity ? "COMPLETE" : "INCOMPLETE",
      exceedsCapacity: afterCreation > capacity,
      error: null,
    };
  } catch (error) {
    return {
      isValid: false,
      rows: [],
      seatsToCreate: 0,
      afterCreation: activeSeatCount,
      remaining: Math.max(capacity - activeSeatCount, 0),
      layoutStatus: activeSeatCount === capacity ? "COMPLETE" : "INCOMPLETE",
      exceedsCapacity: false,
      error: error.message,
    };
  }
};

export {
  buildSeatNumber,
  countPreviewSeats,
  generateSequentialRows,
  getSequentialSeatPreview,
  normalizeRow,
  normalizeSequentialSeatInput,
  numberToRowLabel,
  parseExcludedColumns,
  rowLabelToNumber,
};
