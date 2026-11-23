import React from 'react';
import { Box, Table } from '@mui/material';

/**
 * A table inside a card. It runs to the card's edges, so row hovers and rules
 * span the full width, while its outer cells keep the card's 24 of padding.
 * Too wide for the card, it scrolls sideways instead of squeezing.
 */
const CardTable: React.FC<{
  children: React.ReactNode;
  minWidth?: number;
  /** Tight rows on a desktop, as in the transaction table. Touch keeps the default. */
  dense?: boolean;
}> = ({ children, minWidth, dense }) => (
  <Box sx={{ overflowX: 'auto', mx: -6 }}>
    <Table
      size="small"
      sx={{
        minWidth,
        '& td:first-of-type, & th:first-of-type': { pl: 6 },
        '& td:last-of-type, & th:last-of-type': { pr: 6 },
        ...(dense
          ? {
              '@media (pointer: fine)': {
                '& td, & th': { py: 1, px: 2 },
                '& .MuiButton-sizeSmall': { height: 26 },
                '& .MuiChip-sizeSmall': { height: 22 },
              },
            }
          : {}),
      }}
    >
      {children}
    </Table>
  </Box>
);

export default CardTable;
