import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * The rows behind a sentence, as they came.
 *
 * Every finding the API makes carries its evidence, and the point of showing
 * it raw is that the sentence can be checked rather than believed. Formatted,
 * monospaced, and never the primary reading.
 */
export function Evidence({ data, label = 'Evidence' }: { data: unknown; label?: string }) {
  if (data === null || data === undefined) return null;
  return (
    <Box sx={{ mt: 1 }}>
      {label && (
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.25,
          borderRadius: 1,
          bgcolor: 'var(--mui-palette-background-neutral)',
          fontFamily: 'var(--font-geist-mono)',
          fontSize: 12,
          lineHeight: 1.6,
          overflowX: 'auto',
          color: 'text.secondary',
          maxHeight: 280,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Box>
  );
}

/** An id, a fingerprint, a version — anything read out character by character. */
export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12.5, color: 'text.secondary', wordBreak: 'break-all' }}
    >
      {children}
    </Box>
  );
}
