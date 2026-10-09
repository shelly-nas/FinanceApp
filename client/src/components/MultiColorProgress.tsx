import React, { useState } from 'react';
import { Box, Tooltip, useTheme } from '@mui/material';
import { tokensFor } from '@/theme';

interface MultiColorProgressProps {
  segments: { value: number; color: string; name: string }[];
  height?: number;
}

/**
 * A horizontal bar split into category segments, largest first. Hovering a
 * segment names it; clicking one dims the others until it is clicked again.
 */
const MultiColorProgress: React.FC<MultiColorProgressProps> = ({ segments, height = 16 }) => {
  const { palette } = useTheme();
  const t = tokensFor(palette.mode);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const sortedSegments = [...segments].sort((a, b) => b.value - a.value);

  return (
    <Box
      sx={{
        display: 'flex',
        borderRadius: 999,
        height,
        overflow: 'hidden',
        background: t.surface3,
      }}
    >
      {sortedSegments.map((segment, index) => (
        <Tooltip key={segment.name} title={segment.name} placement="top">
          <Box
            onClick={() => setSelectedSegment(selectedSegment === segment.name ? null : segment.name)}
            sx={{
              width: `${segment.value}%`,
              backgroundColor: segment.color,
              height: '100%',
              // A hairline in the surface colour keeps adjacent segments apart.
              borderRight: index !== sortedSegments.length - 1 ? `2px solid ${t.surface}` : 'none',
              cursor: 'pointer',
              transition: 'opacity .15s ease',
              opacity: selectedSegment && selectedSegment !== segment.name ? 0.3 : 1,
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default MultiColorProgress;
