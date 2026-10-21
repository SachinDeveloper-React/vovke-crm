import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

/**
 * What a page shows while its read is in flight.
 *
 * Every page here is behind a Suspense boundary because every page reads live
 * data — nothing about an operator's figures can be prerendered — so the
 * fallback is part of the design rather than an afterthought.
 */
export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5 }}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="40%" height={44} />
            <Skeleton width="30%" height={16} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function PanelSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card sx={{ p: 3 }}>
      <Skeleton width="30%" height={26} />
      <Skeleton variant="rounded" height={height} sx={{ mt: 2 }} />
    </Card>
  );
}

export function PageSkeleton() {
  return (
    <Stack spacing={3}>
      <StatRowSkeleton />
      <PanelSkeleton />
      <PanelSkeleton height={200} />
    </Stack>
  );
}
