import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import { Panel, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago } from '@/src/lib/format';
import type { AppConfigView } from '@/src/lib/types';

import { at, CONTACT_GROUPS, CONTACT_PATHS, namesRetiredDomain } from './fields';
import { ContactGroupForm } from './forms';

/**
 * Contact & links (RULES P21): the support email, the phone and WhatsApp
 * numbers, the company's address, the policy links, the store links and the
 * social profiles — everything a member or a visitor uses to reach the
 * company — on one page, in the words of the screens that show them.
 *
 * These are config keys like any other (App config lists them too); this is
 * the page that says what each one is and where it shows, and saves only
 * what changed. The app and the website read them live, so a change here is
 * a change everywhere, with no deploy and no app release.
 */
export async function ContactView() {
  const config = await adminGet<AppConfigView>('/admin/config');
  const effective = Object.fromEntries(config.sections.map(section => [section.section, section.effective]));
  const defaults = Object.fromEntries(config.sections.map(section => [section.section, section.defaults]));
  const values = Object.fromEntries(CONTACT_PATHS.map(path => [path, at(effective, path)]));
  const shipped = Object.fromEntries(CONTACT_PATHS.map(path => [path, at(defaults, path)]));

  const retired = CONTACT_GROUPS.flatMap(group => group.fields).filter(field => namesRetiredDomain(values[field.path]));
  const support = config.sections.find(section => section.section === 'support');
  const phone = values['support.phone'];

  return (
    <Stack spacing={3}>
      {retired.length > 0 && (
        <Alert severity="error" variant="outlined">
          {retired.length === 1 ? 'One detail still points' : `${retired.length} details still point`} at vokve.app, a domain
          the company does not own: {retired.map(field => field.label).join(', ')}. Press “Default” beside each to move it to
          vokve.com, or type the right one in.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Support email"
            value={String(values['support.email'] ?? '—')}
            icon="solar:letter-bold-duotone"
            goodDirection="none"
            hint="Email us, in the app and on the website"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Support phone"
            value={typeof phone === 'string' ? phone : 'not shown'}
            icon="solar:phone-bold-duotone"
            goodDirection="none"
            hint={typeof phone === 'string' ? 'Call us, in the app and on the website' : 'Members see email and chat only'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Website"
            value={String(values['support.links.website'] ?? '—').replace(/^https:\/\//, '')}
            icon="solar:global-bold-duotone"
            goodDirection="none"
            hint="Where the app's About screen points"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Last changed"
            value={ago(support?.updatedAt)}
            icon="solar:history-bold-duotone"
            goodDirection="none"
            hint={support?.updatedBy ? `by ${support.updatedBy}` : 'Nobody has changed these yet'}
          />
        </Grid>
      </Grid>

      {CONTACT_GROUPS.map(group => (
        <Panel key={group.id} title={group.title} subtitle={group.subtitle}>
          <ContactGroupForm
            groupId={group.id}
            values={Object.fromEntries(group.fields.map(field => [field.path, values[field.path]]))}
            shipped={Object.fromEntries(group.fields.map(field => [field.path, shipped[field.path]]))}
          />
        </Panel>
      ))}
    </Stack>
  );
}
