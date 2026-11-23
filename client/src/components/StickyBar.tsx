import React, { useEffect, useRef, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { TOPBAR_HEIGHT } from '@/scenes/layout/AppShell';

interface Props {
  children: React.ReactNode;
  /** Background behind the bar - the surface it sits on, so rows scroll under it. */
  surface?: 'default' | 'paper';
  sx?: SxProps<Theme>;
}

/**
 * Keeps a row of filters in view while the page scrolls, so a long page can be
 * read with its filters still at hand. Below `md` it stops under the top bar.
 *
 * A divider appears only once the bar is actually stuck: at rest it sits in
 * the layout like any other row, and a line there would separate nothing.
 */
const StickyBar: React.FC<Props> = ({ children, surface = 'default', sx }) => {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const theme = useTheme();
  const offset = useMediaQuery(theme.breakpoints.up('md')) ? 0 : TOPBAR_HEIGHT;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      // Out of view above the top edge means stuck; out of view below it
      // means the bar has not been reached yet.
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top <= offset),
      { rootMargin: `-${offset + 1}px 0px 0px 0px` },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [offset]);

  return (
    <>
      <div ref={sentinel} aria-hidden style={{ height: 0 }} />
      <Box
        sx={[
          {
            position: 'sticky',
            top: { xs: TOPBAR_HEIGHT, md: 0 },
            zIndex: theme.zIndex.appBar - 1,
            bgcolor: surface === 'paper' ? 'background.paper' : 'background.default',
            borderBottom: '1px solid',
            borderColor: stuck ? 'divider' : 'transparent',
            transition: 'border-color 150ms ease',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    </>
  );
};

export default StickyBar;
