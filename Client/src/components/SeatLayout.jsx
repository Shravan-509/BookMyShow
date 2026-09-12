import { Button } from 'antd';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    clampTransform,
    getSeatTypeLabel,
    getPhysicalLayoutMetrics,
    getReadableDefaultTransform,
    groupPhysicalSeatsByRow,
    PHYSICAL_LAYOUT_DIMENSIONS,
    SHOWSEAT_LAYOUT_STATUS,
    SHOWSEAT_STATUS,
    zoomTransformAroundCenter,
} from './seatLayoutUtils';

const seatTypeClasses = {
    STANDARD: "!border-gray-200",
    PREMIUM: "!border-blue-300",
    RECLINER: "!border-amber-300",
};

const seatTypeLegend = [
    { type: "STANDARD", className: "border-gray-300 bg-gray-100", label: "Standard" },
    { type: "PREMIUM", className: "border-blue-300 bg-blue-50", label: "Premium" },
    { type: "RECLINER", className: "border-amber-300 bg-amber-50", label: "Recliner" },
];

const EMPTY_SHOW_SEATS = [];

export const SeatLayout = ({
    totalSeats,
    bookedSeats = [],
    selectedSeats = [],
    onSeatSelect,
    layoutStatus = SHOWSEAT_LAYOUT_STATUS.LEGACY,
    showSeats = EMPTY_SHOW_SEATS,
    getSeatPrice = null,
}) => {
    const seatsPerRow = 15;
    const numRows = Math.ceil(totalSeats / seatsPerRow)
    const [transformOverride, setTransformOverride] = useState(null)
    const [viewportSize, setViewportSize] = useState(() => ({
        width: typeof window === "undefined" ? 960 : window.innerWidth,
        height: 400,
    }))
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)
    const isPhysicalMode = layoutStatus === SHOWSEAT_LAYOUT_STATUS.INITIALIZED && showSeats.length > 0
    const physicalRows = useMemo(() => (
        isPhysicalMode ? groupPhysicalSeatsByRow(showSeats) : []
    ), [isPhysicalMode, showSeats])
    const physicalDimensionOptions = useMemo(() => ({
        seatSize: viewportSize.width < 640
            ? PHYSICAL_LAYOUT_DIMENSIONS.mobileSeatSize
            : PHYSICAL_LAYOUT_DIMENSIONS.seatSize,
    }), [viewportSize.width])
    const physicalMetrics = useMemo(() => (
        getPhysicalLayoutMetrics(physicalRows, physicalDimensionOptions)
    ), [physicalDimensionOptions, physicalRows])
    const minimumScale = isPhysicalMode ? PHYSICAL_LAYOUT_DIMENSIONS.minScale : 0.5
    const maximumScale = isPhysicalMode ? PHYSICAL_LAYOUT_DIMENSIONS.maxScale : 3
    const getDefaultTransform = useCallback(() => (
        getReadableDefaultTransform(physicalMetrics, viewportSize)
    ), [physicalMetrics, viewportSize])
    const defaultTransform = useMemo(() => (
        isPhysicalMode ? getDefaultTransform() : { scale: 1, x: 0, y: 0 }
    ), [getDefaultTransform, isPhysicalMode])
    const activeTransform = transformOverride || defaultTransform
    const scale = activeTransform.scale
    const position = { x: activeTransform.x, y: activeTransform.y }
    const scaleOptions = useMemo(() => ({
        minScale: minimumScale,
        maxScale: maximumScale,
    }), [maximumScale, minimumScale])
    const applyTransform = useCallback((nextTransform) => {
        setTransformOverride(clampTransform(
            nextTransform,
            physicalMetrics,
            viewportSize,
            scaleOptions,
        ))
    }, [physicalMetrics, scaleOptions, viewportSize])

    const updateViewportSize = useCallback((node) => {
        const rect = node.getBoundingClientRect?.()
        setViewportSize({
            width: rect?.width || node.clientWidth || (typeof window === "undefined" ? 960 : window.innerWidth),
            height: rect?.height || node.clientHeight || 400,
        })
    }, [])

    const setContainerNode = useCallback((node) => {
        containerRef.current = node
        if (node) {
            updateViewportSize(node)
        }
    }, [updateViewportSize])

    // Generate Row Labels
    const rows = Array.from({ length : numRows }, (_, i) => String.fromCharCode(65 + i));
    const seatLayout = {
        rows,
        seatsPerRow
    }

    const handleWheel = useCallback((e) => {
        if (!isPhysicalMode) {
            return
        }

        e.preventDefault()
        const delta = e.deltaY * -0.01
        const currentTransform = transformOverride || activeTransform
        setTransformOverride(
            zoomTransformAroundCenter(
                currentTransform,
                currentTransform.scale + delta,
                physicalMetrics,
                viewportSize,
                scaleOptions,
            )
        )
    }, [activeTransform, isPhysicalMode, physicalMetrics, scaleOptions, transformOverride, viewportSize])

    const handleTouchStart = (e) => {
        if(e.touches.length === 2)
        {
            // Pinch to Zoom
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
            )
            setDragStart({ distance })
        }
        else if(e.touches.length === 1)
        {
            // Pan
            setIsDragging(true)
            setDragStart({ 
                x : e.touches[0].clientX - position.x,
                y : e.touches[0].clientY - position.y,
             })
        }
    }

    const handleTouchMove = (e) => {
        // e.preventDefault()
        if (e.touches.length === 2 && dragStart.distance) 
        {
            // Pinch to zoom
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
            )
            const scaleChange = distance / dragStart.distance
            setTransformOverride(zoomTransformAroundCenter(
                activeTransform,
                scale * scaleChange,
                physicalMetrics,
                viewportSize,
                scaleOptions,
            ))
            setDragStart({ distance })
        } 
        else if (e.touches.length === 1 && isDragging) 
        {
            // Pan
            applyTransform({
                ...activeTransform,
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
            })
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        setDragStart({ x: 0, y: 0 })
    }

    const handleMouseDown = (e) => {
        if (e.target.closest?.("button")) {
            return
        }

        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        })
    }

    const handleMouseMove = (e) => {
        if (isDragging) {
            applyTransform({
                ...activeTransform,
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const zoomIn = () => setTransformOverride(zoomTransformAroundCenter(
        activeTransform,
        scale + 0.2,
        physicalMetrics,
        viewportSize,
        scaleOptions,
    ))
    const zoomOut = () => setTransformOverride(zoomTransformAroundCenter(
        activeTransform,
        scale - 0.2,
        physicalMetrics,
        viewportSize,
        scaleOptions,
    ))
    const resetZoom = () => {
        setTransformOverride(null)
    }

    useEffect(() => {
        const container = containerRef.current
        if (container) 
        {
            container.addEventListener("wheel", handleWheel, { passive: false })
            return () => container.removeEventListener("wheel", handleWheel)
        }
    }, [handleWheel])

    useEffect(() => {
        const container = containerRef.current
        if (!container || typeof ResizeObserver === "undefined") {
            return undefined
        }

        const observer = new ResizeObserver(() => updateViewportSize(container))
        observer.observe(container)

        return () => observer.disconnect()
    }, [updateViewportSize])


    const buildButtonClass = ({ isBooked, isSelected, seatType = "STANDARD", isPhysical = false }) => {
        let buttonClass = `${isPhysical ? "" : "!w-8 !h-8 !m-1"} !flex !items-center !justify-center !text-xs !font-medium !rounded !transition-all !duration-200`

        if(isBooked)
        {
            return `${buttonClass} !bg-gray-400 !text-gray-600 !cursor-not-allowed !border-gray-400`
        }

        if(isSelected){
            return `${buttonClass} !bg-[#1ea83c] !text-white !border-[#1ea83c] !shadow-md`
        }

        buttonClass += " !bg-gray-100 !text-gray-700 hover:!bg-gray-200 hover:!border-gray-300"
        return `${buttonClass} ${seatTypeClasses[seatType] || seatTypeClasses.STANDARD}`
    }

    const renderLegacySeat = (rowLabel, seatNumber) => {
        const seatId = `${rowLabel}${seatNumber}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        return(
            <Button
                key={seatId}
                size='small'
                type={isSelected ? "primary" : "default"}
                className={buildButtonClass({ isBooked, isSelected })}
                disabled={isBooked}
                aria-label={`Seat ${seatId}, Standard, ${isBooked ? "Booked" : isSelected ? "Selected" : "Available"}`}
                aria-pressed={isSelected}
                onClick={() => onSeatSelect(seatId)}
            >
                {seatNumber}
            </Button>
        )
    }

    const physicalCellStyle = {
        width: physicalMetrics.seatSize,
        height: physicalMetrics.seatSize,
        minWidth: physicalMetrics.minSeatSize,
        marginRight: physicalMetrics.seatGap,
    }

    const renderPhysicalSeat = (seat) => {
        const seatId = seat.seatNumber;
        const seatType = seat.seatType || "STANDARD";
        const isBooked = seat.status === SHOWSEAT_STATUS.BOOKED;
        const isSelected = selectedSeats.includes(seatId);
        const seatTypeLabel = getSeatTypeLabel(seatType);
        const seatPrice = typeof getSeatPrice === "function" ? getSeatPrice(seatType) : null;

        return (
            <Button
                key={seat.showSeatId || `${seat.row}-${seat.column}-${seat.seatNumber}`}
                size="small"
                type={isSelected ? "primary" : "default"}
                className={buildButtonClass({ isBooked, isSelected, seatType, isPhysical: true })}
                style={physicalCellStyle}
                disabled={isBooked}
                data-testid={`seat-${seatId}`}
                aria-label={`Seat ${seatId}, ${seatTypeLabel}, ${isBooked ? "Booked" : isSelected ? "Selected" : "Available"}`}
                aria-pressed={isSelected}
                title={`${seatId} • ${seatTypeLabel}${seatPrice ? ` • ₹${seatPrice}` : ""}`}
                onClick={() => onSeatSelect(seatId)}
            >
                {seatId}
            </Button>
        )
    }

    const renderPhysicalRows = () => physicalRows.map((row) => (
        <div
            key={row.rowLabel}
            className="flex items-center"
            style={{ marginBottom: physicalMetrics.rowGap }}
        >
            <div
                className="font-bold text-center text-gray-600 shrink-0"
                style={{
                    width: physicalMetrics.rowLabelWidth,
                    marginRight: physicalMetrics.seatGap,
                }}
            >
                {row.rowLabel}
            </div>
            <div className="flex justify-start">
                {row.cells.map((cell) => (
                    cell.type === "seat"
                        ? renderPhysicalSeat(cell.seat)
                        : (
                            <div
                                key={`${row.rowLabel}-gap-${cell.column}`}
                                data-testid={`seat-gap-${row.rowLabel}-${cell.column}`}
                                aria-hidden="true"
                                style={physicalCellStyle}
                            />
                        )
                ))}
            </div>
        </div>
    ))

  return (
    <div className="seat-layout-container">
        <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex gap-2">
                <Button size="small" onClick={zoomOut} className="min-w-10! h-8!" data-testid="seat-map-zoom-out" aria-label="Zoom out">
                    -
                </Button>
                <Button size="small" onClick={resetZoom} className="min-w-15! h-8! text-xs!" data-testid="seat-map-reset" aria-label="Reset seat map">
                    Reset
                </Button>
                <Button size="small" onClick={zoomIn} className="min-w-10! h-8!" data-testid="seat-map-zoom-in" aria-label="Zoom in">
                    +
                </Button>
            </div>
            <div className="text-xs text-gray-500">Pinch to zoom • Drag to pan</div>
        </div>
        <div
            ref={setContainerNode}
            className="seat-map-viewport overflow-hidden border border-gray-200 rounded-lg bg-gray-50"
            style={{
            height: "400px",
            width: "100%",
            position: "relative",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: isPhysicalMode ? "none" : "auto",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className={`seat-map-content ${isPhysicalMode ? "" : "flex flex-col items-center py-4"}`}
                data-testid={isPhysicalMode ? "physical-seat-map-content" : "legacy-seat-map-content"}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: isPhysicalMode ? "top left" : "center center",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                    minWidth: isPhysicalMode ? physicalMetrics.width : "800px",
                    width: isPhysicalMode ? physicalMetrics.width : undefined,
                    height: isPhysicalMode ? physicalMetrics.height : undefined,
                    padding: isPhysicalMode ? PHYSICAL_LAYOUT_DIMENSIONS.contentPadding : undefined,
                }}
            >
                {
                    isPhysicalMode ? (
                        <div
                            data-testid="physical-seat-rows"
                            style={{
                                width: physicalMetrics.rowLabelWidth
                                    + physicalMetrics.seatGap
                                    + physicalMetrics.seatAreaWidth,
                            }}
                        >
                            {renderPhysicalRows()}
                        </div>
                    ) : seatLayout.rows.map((rowLabel, rowIndex) => (
                        <div key={rowIndex} className='flex items-center mb-2'>
                            <div className='w-8 font-bold text-center mr-3 text-gray-600'>{rowLabel}</div>
                            <div className='flex flex-wrap justify-center'>
                                {
                                    Array.from({ length : seatLayout.seatsPerRow }, 
                                                (_, i) => i + 1 ).map((seatNumber) => renderLegacySeat(rowLabel, seatNumber),)
                                }
                            </div>
                        </div>
                    ))
                }
                {isPhysicalMode && (
                    <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-gray-600">
                        {seatTypeLegend.map((item) => (
                            <div key={item.type} className="flex items-center gap-1">
                                <span className={`inline-block w-4 h-4 rounded border ${item.className}`} />
                                <span>
                                    {item.label}
                                    {typeof getSeatPrice === "function" ? ` ₹${getSeatPrice(item.type)}` : ""}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}
