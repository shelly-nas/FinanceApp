// DateFilter.tsx
import React from 'react';
import { Divider, Typography, useTheme } from '@mui/material';
import FlexBetween from '@/components/FlexBetween';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowButton from '@/components/ArrowButton';
import DateRangeBox from '@/scenes/dateRange/DateRangeBox';
import { useDateRange } from '@/scenes/dateRange/DateRangeContext';

const DateRange: React.FC = () => {
  const { palette } = useTheme();
  const { firstDay, lastDay, incrementMonth, decrementMonth } = useDateRange();

  return (
    <FlexBetween mb="0.25rem" p="0.5rem 0rem">
      {/* LEFT SIDE */}
      <FlexBetween gap="0.75rem">
        <DateRangeBox>
          <ArrowButton onClick={decrementMonth}>
            <ArrowLeftIcon sx={{fontSize: 20}} />
          </ArrowButton>
          <Divider color={palette.cosmetics.colorPrimary} orientation="vertical" flexItem />
          <FlexBetween gap="0.75rem" paddingLeft="10px" paddingRight="10px">
            <CalendarMonthIcon sx={{fontSize: 16}} />
            <Typography variant="h2">
              {`${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} TO ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </Typography>
          </FlexBetween>
          <Divider color={palette.cosmetics.colorPrimary} orientation="vertical" flexItem/>
          <ArrowButton onClick={incrementMonth}>
            <ArrowRightIcon sx={{fontSize: 20}} />
          </ArrowButton>
        </DateRangeBox>
      </FlexBetween>
    </FlexBetween>
  );
};

export default DateRange;
