import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface MultiColorProgressProps {
  segments: { value: number; color: string; name: string }[];
  height?: number;
}

const MultiColorProgress: React.FC<MultiColorProgressProps> = ({ segments, height = 18 }) => {
  const { palette } = useTheme();
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>, name: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX + rect.width / 2 });
    setSelectedSegment(selectedSegment === name ? null : name);
  };

  // Sort segments by value in descending order
  const sortedSegments = [...segments].sort((a, b) => b.value - a.value);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', borderRadius: 5, height: height, overflow: 'hidden', background: palette.grey[200], ml: 1, mr: 1, mt: 1 }}>
        {sortedSegments.map((segment, index) => (
          <Box
            key={index}
            onClick={(event) => handleClick(event, segment.name)}
            sx={{
              width: `${segment.value}%`,
              backgroundColor: segment.color,
              height: '100%',
              borderRight: index !== segments.length - 1 ? `2px solid rgba(255, 255, 255, 0.5)` : 'none',
              cursor: 'pointer', // Change cursor to pointer on hover
              '&:hover': {
                opacity: 0.8, // Slightly reduce opacity on hover
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)', // Add shadow effect on hover
              },
              transition: 'all 0.3s ease-in-out',
              opacity: selectedSegment && selectedSegment !== segment.name ? 0.3 : 1, // Adjust opacity of other segments
            }}
          />
        ))}
      </Box>
      {selectedSegment && hoverPosition && (
        <Box
          sx={{
            position: 'absolute',
            top: "-200%",
            left: "50%",
            transform: 'translateX(-50%)', // Center horizontally
            p: 0.75,
            backgroundColor: palette.grey[200], // Slightly transparent grey background
            borderRadius: 3,
            boxShadow: 3,
            pointerEvents: 'none', // Make the box non-interactive
          }}
        >
          <Typography variant="body2" fontWeight="bold" align="center" color={palette.grey[700]}>{selectedSegment}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MultiColorProgress;
