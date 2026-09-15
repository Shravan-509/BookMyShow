import { useMemo } from "react"
import { Button, Card, Space, Tag, Typography } from "antd"
import { StarOutlined, EyeOutlined } from "@ant-design/icons"
import { groupPhysicalSeatsByRow } from "./seatLayoutUtils"
import { formatCurrency, getSeatTypeLabel } from "../utils/ticketPricing"

const { Text, Title } = Typography

const SeatRecommendation = ({ 
    totalSeats, 
    bookedSeats = [], 
    availableSeats = [],
    selectedSeats = [], 
    onSeatSelect, 
    groupSize = 1, 
    preferences = {},
    getSeatPrice = null,
}) => {

    const getRecommendationReason = (rowIndex, startSeat, groupSize, totalRows, seatsPerRow) => {
        const reasons = []

        if (rowIndex >= totalRows * 0.3 && rowIndex <= totalRows * 0.7) 
        {
            reasons.push("Optimal viewing distance")
        }

        if (Math.abs(startSeat + groupSize / 2 - seatsPerRow / 2) < 3) 
        {
            reasons.push("Center seats")
        }

        if (startSeat === 1 || startSeat + groupSize - 1 === seatsPerRow) 
        {
            reasons.push("Aisle access")
        }

        return reasons.length > 0 ? reasons.join(" • ") : "Good seats available"
    }

    const recommendations = useMemo(() => {
        if (availableSeats.length > 0) {
            const physicalRows = groupPhysicalSeatsByRow(availableSeats)
            const totalRows = physicalRows.length
            const optimalRowIndex = Math.floor(totalRows * 0.4)
            const recommendations = []

            physicalRows.forEach((row, rowIndex) => {
                const rowSeats = row.cells
                    .filter((cell) => cell.type === "seat")
                    .map((cell) => cell.seat)

                for (let startIndex = 0; startIndex <= rowSeats.length - groupSize; startIndex += 1) {
                    const seatGroup = rowSeats.slice(startIndex, startIndex + groupSize)
                    const isConsecutive = seatGroup.every((seat, index) => (
                        index === 0 || seat.column === seatGroup[index - 1].column + 1
                    ))

                    if (!isConsecutive) {
                        continue
                    }

                    const firstColumn = seatGroup[0].column
                    const lastColumn = seatGroup[seatGroup.length - 1].column
                    const centerColumn = rowSeats[Math.floor(rowSeats.length / 2)]?.column || firstColumn
                    const rowDistance = Math.abs(rowIndex - optimalRowIndex)
                    const colDistance = Math.abs((firstColumn + lastColumn) / 2 - centerColumn)
                    let score = Math.max(0, 100 - (rowDistance * 10 + colDistance * 5))

                    if (preferences.preferCenter && colDistance < 3) score += 20
                    if (preferences.preferBack && rowIndex > totalRows * 0.6) score += 15
                    if (preferences.preferAisle && (startIndex === 0 || startIndex + groupSize === rowSeats.length)) score += 10

                    recommendations.push({
                        seats: seatGroup.map((seat) => ({
                            seatId: seat.seatNumber,
                            rowLabel: seat.row,
                            seatNumber: seat.column,
                            rowIndex,
                            seatIndex: startIndex,
                            seatType: seat.seatType || "STANDARD",
                        })),
                        score,
                        reason: getRecommendationReason(rowIndex, firstColumn, groupSize, totalRows, rowSeats.length),
                    })
                }
            })

            return recommendations.sort((a, b) => b.score - a.score).slice(0, 3)
        }

        if (!totalSeats || totalSeats === 0) return []

        const seatsPerRow = 15;
        const numRows = Math.ceil(totalSeats / seatsPerRow)
        const rows = Array.from({ length: numRows }, (_, i) => String.fromCharCode(65 + i))

        // Calculate optimal viewing distance (middle rows)
        const optimalRowIndex = Math.floor(numRows * 0.4) // 40% from front
        const centerSeatIndex = Math.floor(seatsPerRow / 2)

        const recommendations = []

        // Find best consecutive seats for group
        for (let rowIndex = 0; rowIndex < numRows; rowIndex++) 
        {
            const rowLabel = rows[rowIndex];

            for (let startSeat = 1; startSeat <= seatsPerRow - groupSize + 1; startSeat++) 
            {
                const seatGroup = []
                let isValidGroup = true

                // Check if we can fit the group size
                for (let i = 0; i < groupSize; i++) 
                {
                    const seatNumber = startSeat + i;
                    const seatId = `${rowLabel}${seatNumber}`

                    // Checkk if seat exists and is not booked
                    const totalSeatNumber = rowIndex * seatsPerRow + seatNumber
                    if (totalSeatNumber > totalSeats || bookedSeats.includes(seatId)) 
                    {
                        isValidGroup = false
                        break;
                    }
                    seatGroup.push({
                        seatId,
                        rowLabel, 
                        seatNumber,
                        rowIndex,
                        seatIndex: seatNumber - 1
                    })
                }

                if (isValidGroup && seatGroup.length === groupSize) 
                {
                    // Calculate recommendation score
                    let score = 0

                    // Distance from optimal viewing position
                    const rowDistance = Math.abs(rowIndex - optimalRowIndex)
                    const colDistance = Math.abs(startSeat + groupSize / 2 - centerSeatIndex)
                    score += Math.max(0, 100 - (rowDistance * 10 + colDistance * 5))

                    // Preference bonuses
                    if (preferences.preferCenter && colDistance < 3) score += 20
                    if (preferences.preferBack && rowIndex > numRows * 0.6) score += 15
                    if (preferences.preferAisle && (startSeat === 1 || startSeat + groupSize -1 === seatsPerRow)) score += 10

                    recommendations.push({
                        seats: seatGroup,
                        score,
                        reason: getRecommendationReason(rowIndex, startSeat, groupSize, numRows, seatsPerRow),
                    })
                }
            }
        }

        // Sort by score and return top 3
        return recommendations.sort((a, b) => b.score - a.score).slice(0, 3)
    }, [availableSeats, totalSeats, bookedSeats, groupSize, preferences])

    const selectedRecommendation = useMemo(() => 
    {
        // Check if current selected seats match any recommendation
        const matchingRecommendation = recommendations.findIndex((rec) => {
            const recSeatIds = rec.seats.map((s) => s.seatId).sort()
            const currentSeatIds = [...selectedSeats].sort()

            return (
                recSeatIds.length === currentSeatIds.length &&
                recSeatIds.every(
                    (seatId, index) => seatId === currentSeatIds[index]
                )
            )
        })

        return matchingRecommendation >= 0 ? matchingRecommendation : null
    }, [selectedSeats, recommendations])

    const handleQuickSelect = (recommendedSeats, index) => {
        // Clear current selection and select recommended seats one by one
        if(selectedRecommendation === index)
        {
            // Undo Selection - clear all selected seats
            onSeatSelect([])
        }
        else
        {
            // Select new Recommendation
            onSeatSelect(recommendedSeats);
        }
        
    }

    const isRecommendationSelected = (index) => {
        return selectedRecommendation === index
    }

  if (recommendations.length === 0) return null

  return (
    <Card className="seat-recommendation-card" size="small">
      <div className="seat-recommendation-header">
        <StarOutlined />
        <Title level={5}>
          Recommended seats
        </Title>
      </div>

      <Space className="seat-recommendation-grid" size="small">
        {
            recommendations.map((rec, index) => {
                const isSelected = isRecommendationSelected(index)
                const recommendationAmount = rec.seats.reduce((sum, seat) => {
                    if (typeof getSeatPrice !== "function") {
                        return sum
                    }

                    return sum + Number(getSeatPrice(seat.seatType || "STANDARD") || 0)
                }, 0)
                const seatTypes = [...new Set(rec.seats.map((seat) => getSeatTypeLabel(seat.seatType)))].join(", ")

                return (
                    <div key={index} className={`seat-recommendation-option ${isSelected ? "selected" : ""}`}>
                        <div className="seat-recommendation-copy">
                            <div className="seat-recommendation-title-row">
                                <Text strong>{rec.seats.map((s) => s.seatId).join(", ")}</Text>
                                <Tag>{seatTypes}</Tag>
                            </div>
                            <Text type="secondary">
                                <EyeOutlined className="mr-1" />
                                {rec.reason}
                            </Text>
                            {recommendationAmount > 0 && (
                                <Text strong>{formatCurrency(recommendationAmount)}</Text>
                            )}
                        </div>
                        <Button
                            type={isSelected ? "primary" : "default"}
                            size="small"
                            onClick={() => handleQuickSelect(rec.seats, index)}
                            className="seat-recommendation-action"
                        >
                            {isSelected ? "Selected" : "Select"}
                        </Button>
                    </div>
                )
            })
        }
      </Space>
    </Card>
  )
}

export default SeatRecommendation
