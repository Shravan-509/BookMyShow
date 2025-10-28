"use client"

import { useMemo, useState, useEffect } from "react"
import { Button, Card, Space, Tag, Typography } from "antd"
import { StarOutlined, EyeOutlined } from "@ant-design/icons"

const { Text, Title } = Typography

const SeatRecommendation = ({ 
    totalSeats, 
    bookedSeats = [], 
    selectedSeats = [], 
    onSeatSelect, 
    groupSize = 1, 
    preferences = {} 
}) => {
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);

    const getRecommendationReason = (rowIndex, startSeat, groupSize, totalRows, seatsPerRow, prefs) => {
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
                        reason: getRecommendationReason(rowIndex, startSeat, groupSize, numRows, seatsPerRow, preferences),
                    })
                }
            }
        }

        // Sort by score and return top 3
        return recommendations.sort((a, b) => b.score - a.score).slice(0, 3)
    }, [totalSeats, bookedSeats, groupSize, preferences])

    useEffect(() => {
        // Check if current selected seats match any recommendation
        const matchinRecommendation = recommendations.findIndex((rec) => {
            const recSeatIds = rec.seats.map((s) => s.seatId).sort();
            const currentSeatIds = [...selectedSeats].sort();
            return(
                recSeatIds.length === currentSeatIds.length &&
                recSeatIds.every((seatId, index) => seatId === currentSeatIds[index])
            )
        })
        setSelectedRecommendation(matchinRecommendation >= 0 ? matchinRecommendation : null)
    }, [selectedSeats, recommendations])

    const handleQuickSelect = (recommendedSeats, index) => {
        // Clear current selection and select recommended seats one by one
        if(selectedRecommendation === index)
        {
            // Undo Selection - clear all selected seats
            setSelectedRecommendation(null);
            onSeatSelect([]) // Celar all selected seats
        }
        else
        {
            // Select new Recommendation
            setSelectedRecommendation(index)
            onSeatSelect(recommendedSeats);
        }
        
    }

    const isRecommendationSelected = (index) => {
        return selectedRecommendation === index
    }

  if (recommendations.length === 0) return null

  return (
    <Card className="mb-4 border-blue-200! bg-blue-50!" size="small">
      <div className="flex items-center gap-2 mb-3">
        <StarOutlined className="text-blue-600" />
        <Title level={5} className="mb-0! text-blue-800!">
          Recommended Seats for {groupSize} {groupSize === 1 ? "person" : "people"}
        </Title>
      </div>

      <Space direction="vertical" className="w-full" size="small">
        {
            recommendations.map((rec, index) => {
                const isSelected = isRecommendationSelected(index)
                return (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Tag
                                    style={{
                                        background: index === 0
                                        ? "linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FFA000 100%)" // gold
                                        : index === 1
                                        ? "linear-gradient(135deg, #C0C0C0 0%, #B0B0B0 50%, #A0A0A0 100%)" // silver
                                        : "linear-gradient(135deg, #cd7f32 0%, #b87333 50%, #8c6239 100%)", // bronze
                                        color: "white",
                                        border: "none",
                                        fontWeight: "bold"
                                    }}
                                >
                                    #{index + 1}
                                </Tag>
                                <Text strong>
                                    Row {rec.seats[0].rowLabel} - Seats {rec.seats.map((s) => s.seatId).join(", ")}
                                </Text>
                            </div>
                            <Text type="secondary" className="text-xs">
                                <EyeOutlined className="mr-1" />
                                {rec.reason}
                            </Text>
                        </div>
                        <Button
                            type={isSelected ? "primary" : "default"}
                            size="small"
                            onClick={() => handleQuickSelect(rec.seats, index)}
                            className={`transition-all duration-200 ${
                                isSelected
                                    ? "bg-green-600! border-green-600! hover:bg-green-700!"
                                    : "hover:border-blue-400! hover:text-blue-600!"
                                }`
                            }
                        >
                            {isSelected ? "✓ Selected (Click to Undo)" : "Select"}
                        </Button>
                    </div>
                )
            })
        }
      </Space>

      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
        <Text className="text-xs text-yellow-800">
          💡 Recommendations based on optimal viewing distance, center positioning, and your preferences
        </Text>
      </div>
    </Card>
  )
}

export default SeatRecommendation
