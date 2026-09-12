export const SHOWSEAT_LAYOUT_STATUS = Object.freeze({
  INITIALIZED: "INITIALIZED",
  LEGACY: "LEGACY",
});

export const SHOWSEAT_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  BOOKED: "BOOKED",
});

export const PHYSICAL_LAYOUT_DIMENSIONS = Object.freeze({
  seatSize: 40,
  mobileSeatSize: 36,
  minSeatSize: 36,
  seatGap: 8,
  rowGap: 10,
  rowLabelWidth: 44,
  contentPadding: 16,
  edgePadding: 32,
  minScale: 0.55,
  defaultScale: 1,
  mobileDefaultScale: 0.9,
  maxScale: 2,
});

export const SEAT_TYPE_LABELS = Object.freeze({
  STANDARD: "Standard",
  PREMIUM: "Premium",
  RECLINER: "Recliner",
});

export const normalizeSeatLabel = (value) => (
  typeof value === "string" ? value.trim().toUpperCase() : ""
);

export const rowLabelToNumber = (row) => {
  const label = normalizeSeatLabel(row);

  if (!/^[A-Z]+$/.test(label)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return [...label].reduce((total, char) => (
    total * 26 + char.charCodeAt(0) - 64
  ), 0);
};

export const compareRows = (left, right) => {
  const orderDifference = rowLabelToNumber(left) - rowLabelToNumber(right);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return String(left).localeCompare(String(right));
};

export const getSeatTypeLabel = (seatType) => (
  SEAT_TYPE_LABELS[seatType] || "Standard"
);

export const groupPhysicalSeatsByRow = (showSeats = []) => {
  const grouped = showSeats.reduce((rows, seat) => {
    const row = normalizeSeatLabel(seat.row);
    const column = Number(seat.column);

    if (!row || !Number.isInteger(column) || column < 1 || !seat.seatNumber) {
      return rows;
    }

    if (!rows.has(row)) {
      rows.set(row, []);
    }

    rows.get(row).push({
      ...seat,
      row,
      column,
      seatNumber: normalizeSeatLabel(seat.seatNumber),
    });

    return rows;
  }, new Map());

  return [...grouped.entries()]
    .sort(([leftRow], [rightRow]) => compareRows(leftRow, rightRow))
    .map(([rowLabel, seats]) => {
      const sortedSeats = [...seats].sort((left, right) => (
        left.column - right.column
        || String(left.seatNumber).localeCompare(String(right.seatNumber))
      ));
      const seatsByColumn = new Map(sortedSeats.map((seat) => [seat.column, seat]));
      const minColumn = sortedSeats[0]?.column || 1;
      const maxColumn = sortedSeats[sortedSeats.length - 1]?.column || 0;
      const cells = [];

      for (let column = minColumn; column <= maxColumn; column += 1) {
        const seat = seatsByColumn.get(column);
        cells.push(seat ? { type: "seat", column, seat } : { type: "gap", column });
      }

      return {
        rowLabel,
        cells,
      };
    });
};

export const getPhysicalColumnRange = (physicalRows = []) => {
  const columns = physicalRows.flatMap((row) => (
    row.cells.map((cell) => Number(cell.column)).filter(Number.isInteger)
  ));

  if (columns.length === 0) {
    return { minColumn: 1, maxColumn: 0, columnCount: 0 };
  }

  const minColumn = Math.min(...columns);
  const maxColumn = Math.max(...columns);

  return {
    minColumn,
    maxColumn,
    columnCount: maxColumn - minColumn + 1,
  };
};

export const getPhysicalLayoutMetrics = (
  physicalRows = [],
  options = {},
) => {
  const dimensions = {
    ...PHYSICAL_LAYOUT_DIMENSIONS,
    ...options,
  };
  const { columnCount } = getPhysicalColumnRange(physicalRows);
  const rowCount = physicalRows.length;
  const seatAreaWidth = columnCount > 0
    ? columnCount * dimensions.seatSize + Math.max(columnCount - 1, 0) * dimensions.seatGap
    : 0;
  const seatAreaHeight = rowCount > 0
    ? rowCount * dimensions.seatSize + Math.max(rowCount - 1, 0) * dimensions.rowGap
    : 0;
  const width = dimensions.contentPadding * 2
    + dimensions.rowLabelWidth
    + dimensions.seatGap
    + seatAreaWidth;
  const height = dimensions.contentPadding * 2
    + seatAreaHeight;

  return {
    ...dimensions,
    rowCount,
    columnCount,
    seatAreaWidth,
    seatAreaHeight,
    width,
    height,
  };
};

export const clampScale = (
  scale,
  {
    minScale = PHYSICAL_LAYOUT_DIMENSIONS.minScale,
    maxScale = PHYSICAL_LAYOUT_DIMENSIONS.maxScale,
  } = {},
) => Math.min(Math.max(Number(scale) || 1, minScale), maxScale);

export const getPanBounds = (
  metrics,
  viewport = {},
  scale = 1,
  edgePadding = PHYSICAL_LAYOUT_DIMENSIONS.edgePadding,
) => {
  const viewportWidth = Number(viewport.width) || 960;
  const viewportHeight = Number(viewport.height) || 400;
  const contentWidth = Number(metrics?.width) || viewportWidth;
  const contentHeight = Number(metrics?.height) || viewportHeight;
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const centeredX = (viewportWidth - scaledWidth) / 2;
  const centeredY = (viewportHeight - scaledHeight) / 2;

  return {
    minX: scaledWidth <= viewportWidth
      ? centeredX
      : viewportWidth - scaledWidth - edgePadding,
    maxX: scaledWidth <= viewportWidth ? centeredX : edgePadding,
    minY: scaledHeight <= viewportHeight
      ? centeredY
      : viewportHeight - scaledHeight - edgePadding,
    maxY: scaledHeight <= viewportHeight ? centeredY : edgePadding,
  };
};

export const clampPanPosition = (
  position,
  metrics,
  viewport = {},
  scale = 1,
) => {
  const bounds = getPanBounds(metrics, viewport, scale);
  const x = Number(position?.x) || 0;
  const y = Number(position?.y) || 0;

  return {
    x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
  };
};

export const clampTransform = (
  transform,
  metrics,
  viewport = {},
  scaleOptions = {},
) => {
  const scale = clampScale(transform?.scale, scaleOptions);
  const position = clampPanPosition(transform, metrics, viewport, scale);

  return {
    ...position,
    scale,
  };
};

export const getReadableDefaultTransform = (
  metrics,
  viewport = {},
) => {
  const viewportWidth = Number(viewport.width) || 960;
  const viewportHeight = Number(viewport.height) || 400;
  const contentWidth = Number(metrics?.width) || viewportWidth;
  const contentHeight = Number(metrics?.height) || viewportHeight;
  const mobileViewport = viewportWidth < 640;
  const scale = mobileViewport
    ? PHYSICAL_LAYOUT_DIMENSIONS.mobileDefaultScale
    : PHYSICAL_LAYOUT_DIMENSIONS.defaultScale;
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  return {
    scale,
    x: scaledWidth < viewportWidth
      ? (viewportWidth - scaledWidth) / 2
      : PHYSICAL_LAYOUT_DIMENSIONS.edgePadding,
    y: scaledHeight < viewportHeight
      ? (viewportHeight - scaledHeight) / 2
      : PHYSICAL_LAYOUT_DIMENSIONS.edgePadding,
  };
};

export const zoomTransformAroundCenter = (
  transform,
  nextScale,
  metrics,
  viewport = {},
  scaleOptions = {},
) => {
  const viewportWidth = Number(viewport.width) || 960;
  const viewportHeight = Number(viewport.height) || 400;
  const currentScale = clampScale(transform?.scale, scaleOptions);
  const scale = clampScale(nextScale, scaleOptions);
  const currentX = Number(transform?.x) || 0;
  const currentY = Number(transform?.y) || 0;
  const mapCenterX = (viewportWidth / 2 - currentX) / currentScale;
  const mapCenterY = (viewportHeight / 2 - currentY) / currentScale;

  return clampTransform({
    scale,
    x: viewportWidth / 2 - mapCenterX * scale,
    y: viewportHeight / 2 - mapCenterY * scale,
  }, metrics, viewport, scaleOptions);
};
