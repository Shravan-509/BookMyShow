import { Card, Typography } from 'antd'
const { Title, Paragraph } = Typography;
import React from 'react'

const MovieSynopsis = ({movie}) => {
  return (
    <Card>
        <Title level={4} style={{ marginTop: 0 }}>
            Synopsis
        </Title>
        <Paragraph>
            {movie.description ||
            "A thrilling cinematic experience that takes viewers on an unforgettable journey. This movie combines stunning visuals with a compelling storyline that will keep you on the edge of your seat from start to finish."}
        </Paragraph>
    </Card>
  )
}

export default MovieSynopsis