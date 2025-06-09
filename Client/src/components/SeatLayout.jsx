import { Button } from 'antd';
import React from 'react'

export const SeatLayout = ({totalSeats, bookedSeats, selectedSeats, onSeatSelect}) => {
   
    const seatsPerRow = 15;
    const numRows = Math.ceil(totalSeats / seatsPerRow)

    // Generate Row Labels
    const rows = Array.from({ length : numRows }, (_, i) => String.fromCharCode(65 + i));
    const seatLayout = {
        rows,
        seatsPerRow
    }

    const renderSeat = (rowLabel, seatNumber) => {
        const seatId = `${rowLabel}${seatNumber}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        let buttonClass = "!w-8 !h-8 !m-1 !flex !items-center !justify-center"
        if(isBooked)
        {
            buttonClass += " !bg-gray-300 !text-gray-500 !cursor-not-allowed"
        }
        else if(isSelected){
            buttonClass += " !bg-[#1ea83c]"
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
    <div className='flex flex-col items-center'>
        {
            seatLayout.rows.map((rowLabel, rowIndex) => (
                <div key={rowIndex} className='flex items-center mb-2'>
                    <div className='w-6 font-bold text-center mr-2'>{rowLabel}</div>
                    <div className='flex flex-wrap'>
                        {
                            Array.from({ length : seatLayout.seatsPerRow }, 
                                        (_, i) => i + 1 ).map((seatNumber) => renderSeat(rowLabel, seatNumber),)
                        }
                    </div>
                </div>
            ))
        }

    </div>
  )
}
