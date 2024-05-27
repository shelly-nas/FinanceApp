import { useState } from "react"
import { Divider, Typography, useTheme } from "@mui/material"
import FlexBetween from "@/components/FlexBetween"
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowButton from '@/components/ArrowButton';
import DateRangeBox from '@/components/DateRangeBox';

type Props = {};

const DateFilter: React.FC<Props> = () => {
  const { palette } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date('2024-02-01'));

  const getFirstAndLastDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  const incrementMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const decrementMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const { firstDay, lastDay } = getFirstAndLastDayOfMonth(currentDate);

  return (
    <FlexBetween mb="0.25rem" p="0.5rem 0rem">
      {/* LEFT SIDE */}
      <FlexBetween gap="0.75rem">
        <DateRangeBox>
          <ArrowButton onClick={decrementMonth}>
            <ArrowLeftIcon sx={{fontSize: 20}} />
          </ArrowButton>
          <Divider color={palette.cosmetics.color} orientation="vertical" flexItem />
          <FlexBetween gap="0.75rem" paddingLeft="10px" paddingRight="10px">
            <CalendarMonthIcon sx={{fontSize: 16}} />
            <Typography variant="h2">
              {`${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} TO ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </Typography>
          </FlexBetween>
          <Divider color={palette.cosmetics.color} orientation="vertical" flexItem/>
          <ArrowButton onClick={incrementMonth}>
            <ArrowRightIcon sx={{fontSize: 20}} />
          </ArrowButton>
        </DateRangeBox>
      </FlexBetween>
    </FlexBetween>
  );
};

export default DateFilter;
