import { useMediaQuery, useTheme } from '@mui/material';

function useMobile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.down('xl'));

  return { isMobile, isTablet, isDesktop };
}

export default useMobile;
