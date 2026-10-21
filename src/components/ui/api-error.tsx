import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';

import { readableError, type ApiError as ApiErrorType } from '@/src/lib/api';

/**
 * One panel's read failed, and the page says which and why rather than
 * showing an empty card — an operator needs to know the difference between
 * "no problems" and "could not ask".
 */
export function ApiErrorNotice({ error, what }: { error: ApiErrorType; what: string }) {
  return (
    <Alert severity="error" variant="outlined" sx={{ my: 1 }}>
      <AlertTitle sx={{ mb: 0.5 }}>{what} could not be read</AlertTitle>
      <Box sx={{ typography: 'body2' }}>
        {readableError(error)}
        {error.code ? ` (${error.code})` : ''}
      </Box>
    </Alert>
  );
}
