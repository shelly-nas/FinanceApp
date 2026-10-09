import { Button } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { useColorMode } from '@/theme/ColorModeContext';

/** Cycles system, light and dark; the label says which one is active. */
const ThemeModeToggle = () => {
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
    <Button
      variant="text"
      fullWidth
      startIcon={icon}
      onClick={toggleMode}
      aria-label={`${label} - click to change theme`}
      sx={{ justifyContent: 'flex-start', px: 3, fontWeight: 500 }}
    >
      {label}
    </Button>
  );
};

export default ThemeModeToggle;
