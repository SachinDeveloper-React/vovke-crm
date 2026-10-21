
import { forwardRef, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { scrollbarClasses } from './classes';

type ScrollbarProps = Omit<BoxProps, 'children' | 'sx'> & {
  children?: ReactNode;
  sx?: SxProps<Theme>;
  fillContent?: boolean;
  scrollTop?: number;
  keepAtBottom?: boolean;
};

export const Scrollbar = forwardRef<HTMLDivElement, ScrollbarProps>(
  (
    {
      children,
      sx,
      fillContent = false,
      scrollTop = 0,
      keepAtBottom = false,
      ...other
    },
    forwardedRef
  ) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollTop;
      }
    }, [scrollTop]);

    useEffect(() => {
      const element = scrollRef.current;

      if (element && keepAtBottom) {
        element.scrollTop = element.scrollHeight;
      }
    }, [keepAtBottom, children]);

    return (
      <Box
        {...other}
        ref={(node: HTMLDivElement | null) => {
          scrollRef.current = node;

          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        className={scrollbarClasses.root}
        sx={[
          {
            minWidth: 0,
            minHeight: 0,
            flex: '1 1 auto',
            overflowX: 'hidden',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(120, 120, 120, 0.5) transparent',

            '&::-webkit-scrollbar': {
              width: 6,
              height: 6,
            },

            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(120, 120, 120, 0.5)',
              borderRadius: 8,
            },

            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },

            ...(fillContent && {
              display: 'flex',
              flexDirection: 'column',
              '& > *': {
                flexShrink: 0,
              },
            }),
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {children}
      </Box>
    );
  }
);

Scrollbar.displayName = 'Scrollbar';
