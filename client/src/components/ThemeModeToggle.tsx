import { IconButton, Tooltip, useTheme } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useColorMode } from '@/theme/ColorModeContext';

const ThemeModeToggle = () => {
  const { palette } = useTheme();
  const { mode, toggleMode } = useColorMode();

  const icon = {
    system: <SettingsBrightnessIcon />,
    light: <LightModeIcon />,
    dark: <DarkModeIcon />,
  }[mode];

  const label = {
    system: 'System theme',
    light: 'Light theme',
    dark: 'Dark theme',
  }[mode];

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={toggleMode}
        aria-label={`${label} - click to change theme`}
        sx={{ color: palette.grey[700] }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeModeToggle;
