import { Button } from 'antd';
import { useState, useRef, useEffect } from 'react';

export const SeatLayout = ({ totalSeats, bookedSeats, selectedSeats, onSeatSelect }) => {
    const seatsPerRow = 15;
    const numRows = Math.ceil(totalSeats / seatsPerRow)
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)

    // Generate Row Labels
    const rows = Array.from({ length : numRows }, (_, i) => String.fromCharCode(65 + i));
    const seatLayout = {
        rows,
        seatsPerRow
    }

    const handleWheel = (e) => {
        e.preventDefault()
        const delta = e.deltaY * -0.01
        const newScale = Math.min(Math.max(0.5, scale + delta), 3)
        setScale(newScale)
    }

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
            const newScale = Math.min(Math.max(0.5, scale * scaleChange), 3)
            setScale(newScale)
            setDragStart({ distance })
        } 
        else if (e.touches.length === 1 && isDragging) 
        {
            // Pan
            setPosition({
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
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        })
    }

    const handleMouseMove = (e) => {
        if (isDragging) {
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const zoomIn = () => setScale(Math.min(scale + 0.2, 3))
    const zoomOut = () => setScale(Math.max(scale - 0.2, 0.5))
    const resetZoom = () => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
    }

    useEffect(() => {
        const container = containerRef.current
        if (container) 
        {
            container.addEventListener("wheel", handleWheel, { passive: false })
            return () => container.removeEventListener("wheel", handleWheel)
        }
    }, [scale])


    const renderSeat = (rowLabel, seatNumber) => {
        const seatId = `${rowLabel}${seatNumber}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        let buttonClass = "!w-8 !h-8 !m-1 !flex !items-center !justify-center !text-xs !font-medium !rounded !transition-all !duration-200"
        if(isBooked)
        {
            buttonClass += " !bg-gray-400 !text-gray-600 !cursor-not-allowed !border-gray-400"
        }
        else if(isSelected){
            buttonClass += " !bg-[#1ea83c] !text-white !border-[#1ea83c] !shadow-md"
        }
        else {
            buttonClass += " !bg-gray-100 !text-gray-700 !border-gray-200 hover:!bg-gray-200 hover:!border-gray-300"
        }

        return(
            <Button
                key={seatId}
                size='small'
                type={isSelected ? "primary" : "default"}
                className={buttonClass}
                disabled={isBooked}
                onClick={() => onSeatSelect(seatId)}
            >
                {seatNumber}
            </Button>
        )
    }

  return (
    <div className="seat-layout-container">
        <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex gap-2">
                <Button size="small" onClick={zoomOut} className="!min-w-[40px] !h-8">
                    -
                </Button>
                <Button size="small" onClick={resetZoom} className="!min-w-[60px] !h-8 !text-xs">
                    Reset
                </Button>
                <Button size="small" onClick={zoomIn} className="!min-w-[40px] !h-8">
                    +
                </Button>
            </div>
            <div className="text-xs text-gray-500">Pinch to zoom • Drag to pan</div>
        </div>
        <div
            ref={containerRef}
            className="seat-map-viewport overflow-hidden border border-gray-200 rounded-lg bg-gray-50"
            style={{
            height: "400px",
            width: "100%",
            position: "relative",
            cursor: isDragging ? "grabbing" : "grab",
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
                className="seat-map-content flex flex-col items-center py-4"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                    minWidth: "800px",
                }}
            >
                {
                    seatLayout.rows.map((rowLabel, rowIndex) => (
                        <div key={rowIndex} className='flex items-center mb-2'>
                            <div className='w-8 font-bold text-center mr-3 text-gray-600'>{rowLabel}</div>
                            <div className='flex flex-wrap justify-center'>
                                {
                                    Array.from({ length : seatLayout.seatsPerRow }, 
                                                (_, i) => i + 1 ).map((seatNumber) => renderSeat(rowLabel, seatNumber),)
                                }
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    </div>
  )
}
