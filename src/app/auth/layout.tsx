import Box from '@mui/material/Box';

/** One card, centred, nothing else: there is nothing else on this page to do. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        bgcolor: 'background.neutral',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>{children}</Box>
    </Box>
  );
}
