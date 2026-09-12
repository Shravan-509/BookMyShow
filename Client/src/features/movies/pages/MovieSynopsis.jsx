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
            "Synopsis is not available for this movie yet."}
        </Paragraph>
    </Card>
  )
}

export default MovieSynopsis
