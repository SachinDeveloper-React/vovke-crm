import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { FilterBar, Kv, Mono, Panel, SelectFilter, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { BroadcastPreview } from '@/src/lib/types';

import { BroadcastForm } from './broadcast-form';

export type SegmentQuery = {
  tier: string;
  platform: string;
  seenWithinDays: string;
  notSeenForDays: string;
  pushableOnly: boolean;
};

/**
 * Telling more than one member something.
 *
 * The count comes first, and it comes from the same filters the send will
 * use: the segment lives in the URL, so the number on screen is a link
 * somebody else can open and check before anything goes out.
 */
export async function MessagesView({ segment }: { segment: SegmentQuery }) {
  const preview = await adminGet<BroadcastPreview>('/admin/notifications/preview', {
    tier: segment.tier || undefined,
    platform: segment.platform || undefined,
    seenWithinDays: segment.seenWithinDays || undefined,
    notSeenForDays: segment.notSeenForDays || undefined,
    pushableOnly: segment.pushableOnly ? 'true' : undefined,
  });

  const described = [
    segment.tier ? `trust ${segment.tier}` : '',
    segment.platform ? (segment.platform === 'ios' ? 'on iOS' : 'on Android') : '',
    segment.seenWithinDays ? `seen in the last ${segment.seenWithinDays} days` : '',
    segment.notSeenForDays ? `quiet for ${segment.notSeenForDays}+ days` : '',
    segment.pushableOnly ? 'with a phone that can show a push' : '',
  ].filter(Boolean);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stat
            label="This segment is"
            value={number(preview.matched)}
            icon="solar:users-group-two-rounded-bold-duotone"
            goodDirection="none"
            hint={described.length > 0 ? described.join(' · ') : 'every account that has not been deleted'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stat
            label="One send will take"
            value={number(preview.ceiling)}
            icon="solar:shield-check-bold-duotone"
            goodDirection="none"
            hint={preview.overflow ? 'this segment is bigger — narrow it' : 'comfortably more than this segment'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stat
            label="Where it lands"
            value="Feed + push"
            icon="solar:bell-bold-duotone"
            goodDirection="none"
            hint="The row is written for everyone; the push follows each member’s own switch and quiet hours"
          />
        </Grid>
      </Grid>

      <Panel
        title="Who gets it"
        subtitle="The filters are in the URL, so this count is a link"
        note="Deleted accounts are never included. Frozen ones are: a frozen account can still be told things."
      >
        <FilterBar>
          <SelectFilter
            label="Trust tier"
            param="tier"
            value={segment.tier}
            options={[
              { value: '', label: 'Any tier' },
              ...['trusted', 'normal', 'watch', 'restricted', 'banned'].map(value => ({ value, label: value })),
            ]}
            width={140}
          />
          <SelectFilter
            label="Platform"
            param="platform"
            value={segment.platform}
            options={[
              { value: '', label: 'Any phone' },
              { value: 'android', label: 'Android' },
              { value: 'ios', label: 'iOS' },
            ]}
            width={140}
          />
          <SelectFilter
            label="Seen within"
            param="seenWithinDays"
            value={segment.seenWithinDays}
            options={[
              { value: '', label: 'Any time' },
              ...['1', '7', '30', '90'].map(value => ({ value, label: `${value} days` })),
            ]}
            width={150}
          />
          <SelectFilter
            label="Quiet for"
            param="notSeenForDays"
            value={segment.notSeenForDays}
            options={[
              { value: '', label: 'Not filtered' },
              ...['7', '14', '30', '90'].map(value => ({ value, label: `${value}+ days` })),
            ]}
            width={150}
          />
          <SelectFilter
            label="Reachable"
            param="pushableOnly"
            value={segment.pushableOnly ? 'true' : ''}
            options={[
              { value: '', label: 'Everyone matching' },
              { value: 'true', label: 'Only pushable phones' },
            ]}
            width={190}
          />
        </FilterBar>

        {preview.sample.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>
              The first few, so the segment can be spot-checked
            </Typography>
            <Stack spacing={0.25}>
              {preview.sample.map(id => (
                <Mono key={id}>{id}</Mono>
              ))}
            </Stack>
          </Box>
        )}
      </Panel>

      <Panel
        title="What to say"
        subtitle={`To ${number(preview.matched)} member${preview.matched === 1 ? '' : 's'}`}
        note="Every message goes through the same path a job uses, so a member who turned that category off gets the row and no push. There is no bypass, and the answer says how many that was."
      >
        <BroadcastForm
          segment={segment}
          matched={preview.matched}
          overflow={preview.overflow}
          ceiling={preview.ceiling}
        />
      </Panel>

      <Panel title="Before you press it" dense={false}>
        <Kv
          items={[
            { label: 'Can it be recalled?', value: 'No. A notification centre row can be read the moment it is written.' },
            { label: 'Who is left out?', value: 'Deleted accounts, and anyone past the ceiling of one send.' },
            { label: 'Quiet hours', value: 'A push inside them is held until they end, not dropped. The row is written at once.' },
            { label: 'Consent', value: 'The topic decides which switch is asked. “System” asks the announcements switch.' },
            { label: 'Retrying', value: 'One send has one dedupe key, so pressing it twice cannot write two rows in anybody’s feed.' },
          ]}
        />
      </Panel>
    </Stack>
  );
}
