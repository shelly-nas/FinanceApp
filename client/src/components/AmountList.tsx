import React from 'react';
import { Box, Collapse, List, ListItemButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const amountSx = { fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap' } as const;

interface Line {
  key: string;
  label: string;
  amount: string;
}

interface GroupProps {
  label: string;
  amount: React.ReactNode;
  lines: Line[];
  open: boolean;
  onToggle: () => void;
  /** Applied to every amount, e.g. to blur them. */
  amountClassName?: string;
}

/**
 * A labelled total that expands into its parts. The chevron turns rather than
 * swapping icons, and the button says whether it is open.
 */
export const AmountGroup: React.FC<GroupProps> = ({
  label, amount, lines, open, onToggle, amountClassName,
}) => (
  <Box component="li" sx={{ listStyle: 'none' }}>
    <ListItemButton onClick={onToggle} aria-expanded={open} sx={{ px: 2, mx: -2 }}>
      <ExpandMoreIcon
        aria-hidden
        sx={{
          fontSize: 20,
          color: 'text.secondary',
          transition: 'transform .15s ease',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}
      />
      <Typography sx={{ flexGrow: 1, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
        {label}
      </Typography>
      <Typography
        component="span"
        className={amountClassName}
        sx={{ ...amountSx, fontSize: 14, fontWeight: 600, color: 'text.primary' }}
      >
        {amount}
      </Typography>
    </ListItemButton>
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List disablePadding sx={{ pl: 8, pb: 2 }}>
        {lines.map((line) => (
          <Box
            component="li"
            key={line.key}
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, py: 1, listStyle: 'none' }}
          >
            <Typography variant="body2" sx={{ minWidth: 0 }}>{line.label}</Typography>
            <Typography variant="body2" component="span" className={amountClassName} sx={amountSx}>
              {line.amount}
            </Typography>
          </Box>
        ))}
      </List>
    </Collapse>
  </Box>
);

export const AmountGroups: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {children}
  </List>
);

/** A bottom-line figure: label left, value right, above a hairline. */
export const TotalRow: React.FC<{ label: string; children: React.ReactNode; first?: boolean }> = ({
  label, children, first = false,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 4,
      pt: first ? 4 : 2,
      mt: first ? 4 : 0,
      borderTop: first ? 1 : 0,
      borderColor: 'divider',
    }}
  >
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{label}</Typography>
    {children}
  </Box>
);
