'use client';

import { createContext, memo, useContext, useState, type ReactNode } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import {
  emptyOf,
  errorsUnder,
  fieldKind,
  joinPath,
  labelFor,
  summaryOf,
  unwrapNullable,
  type JsonSchema,
} from './schema';
import type { FaqOption } from './types';

/**
 * A form for any website page, drawn from the page's own shape (RULES P22).
 *
 * The API sends the JSON Schema of what it will accept; every box here comes
 * from it — a text box per line, a list with add / move / remove per array, a
 * switch for a section that may be left out, a picker for icons and for
 * Help-centre questions. Nothing in this file knows what a home page is, so a
 * section the API adds tomorrow is editable tomorrow.
 *
 * Every field is memoised and the tree is changed by copying only the path
 * down to the edit (`setIn`), so typing in one box re-renders that box and
 * its parents — not the three hundred others on a policy.
 */

interface EditorContextValue {
  icons: string[];
  faqOptions: FaqOption[];
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (path: string, value: unknown) => void;
}

const EditorContext = createContext<EditorContextValue>({
  icons: [],
  faqOptions: [],
  errors: {},
  disabled: false,
  onChange: () => {},
});

export function SchemaForm({
  schema,
  value,
  icons,
  faqOptions,
  errors,
  disabled,
  onChange,
}: {
  schema: JsonSchema;
  value: Record<string, unknown>;
} & EditorContextValue) {
  const properties = Object.entries(schema.properties ?? {});
  // Lines at the top level (a policy's title, version, dates) sit together in
  // one card; every section and list gets a fold of its own.
  const plain = properties.filter(([key, prop]) => isPlain(prop, key));
  const sections = properties.filter(([key, prop]) => !isPlain(prop, key));
  const general = errorsUnder(
    Object.fromEntries(Object.entries(errors).filter(([path]) => plain.some(([key]) => path === key))),
    '',
  );

  return (
    <EditorContext.Provider value={{ icons, faqOptions, errors, disabled, onChange }}>
      <Stack spacing={1.5}>
        {errors._ && <Alert severity="error">{errors._}</Alert>}
        {plain.length > 0 && (
          <Section title="General" errorCount={general} defaultExpanded>
            <Grid container spacing={2}>
              {plain.map(([key, prop]) => (
                <Grid key={key} size={{ xs: 12, md: wide(prop, key) ? 12 : 6 }}>
                  <Field schema={prop} value={value[key]} path={key} name={key} />
                </Grid>
              ))}
            </Grid>
          </Section>
        )}
        {sections.map(([key, prop], index) => (
          <Section
            key={key}
            title={labelFor(key, prop)}
            subtitle={prop.description ?? unwrapNullable(prop).inner.description}
            errorCount={errorsUnder(errors, key)}
            defaultExpanded={plain.length === 0 && index === 0}
          >
            <Field schema={prop} value={value[key]} path={key} name={key} bare />
          </Section>
        ))}
      </Stack>
    </EditorContext.Provider>
  );
}

function isPlain(schema: JsonSchema, key: string): boolean {
  const kind = fieldKind(unwrapNullable(schema).inner, key).kind;
  return kind === 'text' || kind === 'number' || kind === 'boolean' || kind === 'enum';
}

/** Headlines read whole: a title box is as wide as the form. */
const HEADLINES = new Set(['title', 'defaultTitle', 'question', 'highlight']);

function wide(schema: JsonSchema, key: string): boolean {
  const kind = fieldKind(unwrapNullable(schema).inner, key);
  return (
    kind.kind === 'object' ||
    kind.kind === 'array' ||
    kind.kind === 'variants' ||
    (kind.kind === 'text' && (kind.multiline || HEADLINES.has(key)))
  );
}

function Section({
  title,
  subtitle,
  errorCount,
  defaultExpanded = false,
  children,
}: {
  title: string;
  subtitle?: string;
  errorCount: number;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      variant="outlined"
      slotProps={{ transition: { unmountOnExit: true } }}
      sx={{ borderRadius: 1.5, '&::before': { display: 'none' }, overflow: 'hidden' }}
    >
      <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1">{title}</Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {errorCount > 0 && <Chip size="small" color="error" label={errorCount === 1 ? '1 to fix' : `${errorCount} to fix`} />}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 2.5 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

// ─── One field ─────────────────────────────────────────────────────────────

type FieldProps = {
  schema: JsonSchema;
  value: unknown;
  path: string;
  name: string;
  /** Drawn inside a section or a list item that already carries its title. */
  bare?: boolean;
};

const Field = memo(function Field({ schema, value, path, name, bare = false }: FieldProps) {
  const { nullable, inner } = unwrapNullable(schema);
  const kind = fieldKind(inner, name);

  if (nullable && (kind.kind === 'object' || kind.kind === 'array' || kind.kind === 'variants')) {
    return <OptionalField schema={schema} inner={inner} value={value} path={path} name={name} bare={bare} />;
  }

  switch (kind.kind) {
    case 'object':
      return <ObjectField schema={inner} value={value} path={path} name={name} bare={bare} />;
    case 'array':
      return <ArrayField schema={inner} items={kind.items} value={value} path={path} name={name} bare={bare} />;
    case 'variants':
      return <VariantField schema={inner} variants={kind.variants} discriminator={kind.discriminator} value={value} path={path} />;
    case 'text':
      return <TextBox schema={inner} value={value} path={path} name={name} multiline={kind.multiline} nullable={nullable} />;
    case 'enum':
      return <EnumBox schema={inner} options={kind.options} value={value} path={path} name={name} />;
    case 'number':
      return <NumberBox schema={inner} value={value} path={path} name={name} integer={kind.integer} />;
    case 'boolean':
      return <BooleanBox schema={inner} value={value} path={path} name={name} />;
    default:
      return <RawBox schema={inner} value={value} path={path} name={name} />;
  }
});

function useEditor() {
  return useContext(EditorContext);
}

function helper(errors: Record<string, string>, path: string, schema: JsonSchema, extra?: string) {
  return errors[path] ?? ([schema.description, extra].filter(Boolean).join(' ') || undefined);
}

/** A section or list that may be left out: a switch, and the thing when it is on. */
function OptionalField({ schema, inner, value, path, name, bare }: FieldProps & { inner: JsonSchema }) {
  const { onChange, disabled, errors } = useEditor();
  const on = value !== null && value !== undefined;
  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={
          <Switch checked={on} disabled={disabled} onChange={(_event, checked) => onChange(path, checked ? emptyOf(inner) : null)} />
        }
        label={
          <Typography variant="body2">
            {on ? `Show ${bare ? 'this' : labelFor(name, schema).toLowerCase()}` : `${bare ? 'Not shown' : `${labelFor(name, schema)}: not shown`}`}
          </Typography>
        }
      />
      {errors[path] && <Alert severity="error">{errors[path]}</Alert>}
      {on && <Field schema={inner} value={value} path={path} name={name} bare={bare} />}
    </Stack>
  );
}

function ObjectField({ schema, value, path, name, bare }: FieldProps) {
  const { errors } = useEditor();
  const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const properties = Object.entries(schema.properties ?? {});
  const body = (
    <Grid container spacing={2}>
      {errors[path] && (
        <Grid size={12}>
          <Alert severity="error">{errors[path]}</Alert>
        </Grid>
      )}
      {properties.map(([key, prop]) => (
        <Grid key={key} size={{ xs: 12, md: wide(prop, key) || properties.length === 1 ? 12 : 6 }}>
          <Field schema={prop} value={record[key]} path={joinPath(path, key)} name={key} />
        </Grid>
      ))}
    </Grid>
  );
  if (bare) return body;
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: schema.description ? 0.25 : 1.5 }}>
        {labelFor(name, schema)}
      </Typography>
      {schema.description && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
          {schema.description}
        </Typography>
      )}
      {body}
    </Box>
  );
}

// ─── Lists ─────────────────────────────────────────────────────────────────

/** Lists of short words, not sentences: one line each. */
const SHORT_ITEMS = new Set(['trust', 'keywords', 'path', 'topics', 'columns', 'tags']);

function ArrayField({ schema, items, value, path, name, bare }: FieldProps & { items: JsonSchema }) {
  const { onChange, disabled, errors } = useEditor();
  const list = Array.isArray(value) ? value : [];

  if (schema.widget === 'faq-ids') return <FaqPicker value={list as string[]} path={path} schema={schema} name={name} />;
  if (schema.widget === 'numbers') return <NumbersBox value={list as number[]} path={path} schema={schema} name={name} />;

  const itemKind = fieldKind(unwrapNullable(items).inner, name);
  const max = schema.maxItems ?? Infinity;
  const min = schema.minItems ?? 0;

  const move = (from: number, to: number) => {
    const next = list.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(path, next);
  };
  const remove = (index: number) => onChange(path, list.filter((_item, i) => i !== index));
  const add = () => {
    // A table row gets as many cells as the rows above it.
    const fresh = itemKind.kind === 'array' && list.length > 0 && Array.isArray(list[0])
      ? (list[0] as unknown[]).map(() => '')
      : emptyOf(items);
    onChange(path, [...list, fresh]);
  };

  const controls = (index: number) => (
    <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
      <Tooltip title="Move up">
        <span>
          <IconButton size="small" disabled={disabled || index === 0} onClick={() => move(index, index - 1)}>
            <Iconify icon="solar:alt-arrow-up-linear" width={18} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Move down">
        <span>
          <IconButton size="small" disabled={disabled || index === list.length - 1} onClick={() => move(index, index + 1)}>
            <Iconify icon="solar:alt-arrow-down-linear" width={18} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={list.length <= min ? `Keep at least ${min}` : 'Remove'}>
        <span>
          <IconButton size="small" color="error" disabled={disabled || list.length <= min} onClick={() => remove(index)}>
            <Iconify icon="solar:trash-bin-trash-bold-duotone" width={18} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );

  const label = labelFor(name, schema);
  const simple = itemKind.kind === 'text' || itemKind.kind === 'number' || itemKind.kind === 'enum';

  return (
    <Stack spacing={1.5}>
      {!bare && (
        <Box>
          <Typography variant="subtitle2">{label}</Typography>
          {schema.description && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {schema.description}
            </Typography>
          )}
        </Box>
      )}
      {errors[path] && <Alert severity="error">{errors[path]}</Alert>}

      {list.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Nothing here yet.
        </Typography>
      )}

      {list.map((item, index) => {
        const itemPath = joinPath(path, index);
        if (simple) {
          return (
            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {itemKind.kind === 'text' ? (
                  <TextBox
                    schema={unwrapNullable(items).inner}
                    value={item}
                    path={itemPath}
                    name={String(index)}
                    multiline={!SHORT_ITEMS.has(name)}
                    label={`${label} ${index + 1}`}
                    nullable={false}
                  />
                ) : (
                  <Field schema={items} value={item} path={itemPath} name={String(index)} />
                )}
              </Box>
              {controls(index)}
            </Stack>
          );
        }
        if (itemKind.kind === 'array') {
          // A table row: its cells side by side.
          const cells = Array.isArray(item) ? (item as unknown[]) : [];
          return (
            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Grid container spacing={1} sx={{ flex: 1 }}>
                {cells.map((cell, c) => (
                  <Grid key={c} size={{ xs: 12, md: 12 / Math.min(Math.max(cells.length, 1), 4) }}>
                    <TextBox
                      schema={{ type: 'string' }}
                      value={cell}
                      path={joinPath(itemPath, c)}
                      name={String(c)}
                      multiline
                      label={`Row ${index + 1}, cell ${c + 1}`}
                      nullable={false}
                    />
                  </Grid>
                ))}
              </Grid>
              {controls(index)}
            </Stack>
          );
        }
        return (
          <ListItemCard
            key={index}
            title={`${index + 1}. ${summaryOf(item) || 'Untitled'}`}
            errorCount={errorsUnder(errors, itemPath)}
            controls={controls(index)}
          >
            <Field schema={items} value={item} path={itemPath} name={name} bare />
          </ListItemCard>
        );
      })}

      <Box>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          disabled={disabled || list.length >= max}
          onClick={add}
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
        >
          Add {itemKind.kind === 'array' ? 'row' : 'one'}
        </Button>
      </Box>
    </Stack>
  );
}

function ListItemCard({
  title,
  errorCount,
  controls,
  children,
}: {
  title: string;
  errorCount: number;
  controls: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(errorCount > 0);
  const shown = open || errorCount > 0;
  return (
    <Box sx={{ border: 1, borderColor: errorCount > 0 ? 'error.main' : 'divider', borderRadius: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pl: 1, pr: 0.5, py: 0.5 }}>
        <IconButton size="small" onClick={() => setOpen(!shown)} aria-label={shown ? 'Fold' : 'Open'}>
          <Iconify icon={shown ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} width={18} />
        </IconButton>
        <Typography
          variant="body2"
          onClick={() => setOpen(!shown)}
          sx={{ flex: 1, minWidth: 0, cursor: 'pointer', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {title}
        </Typography>
        {errorCount > 0 && <Chip size="small" color="error" label={`${errorCount} to fix`} />}
        {controls}
      </Stack>
      {shown && <Box sx={{ px: 2, pb: 2, pt: 1 }}>{children}</Box>}
    </Box>
  );
}

/** One of several kinds — a policy's paragraph, list, callout, table or definitions. */
function VariantField({
  schema,
  variants,
  discriminator,
  value,
  path,
}: {
  schema: JsonSchema;
  variants: JsonSchema[];
  discriminator: string;
  value: unknown;
  path: string;
}) {
  const { onChange, disabled } = useEditor();
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const current = variants.find(variant => variant.properties?.[discriminator]?.const === record[discriminator]) ?? variants[0]!;

  const change = (kind: string) => {
    const target = variants.find(variant => variant.properties?.[discriminator]?.const === kind);
    if (!target) return;
    const fresh = emptyOf(target) as Record<string, unknown>;
    // Keep the words across a change of kind where both have a place for them.
    for (const key of ['text', 'title', 'items']) {
      if (key in fresh && key in record && typeof fresh[key] === typeof record[key]) fresh[key] = record[key];
    }
    if (typeof record.text === 'string' && Array.isArray(fresh.items) && fresh.items.length > 0 && typeof fresh.items[0] === 'string' && !('items' in record)) {
      fresh.items = [record.text];
    }
    onChange(path, fresh);
  };

  const rest: JsonSchema = {
    ...current,
    properties: Object.fromEntries(Object.entries(current.properties ?? {}).filter(([key]) => key !== discriminator)),
  };

  return (
    <Stack spacing={2}>
      <TextField
        select
        size="small"
        label="Kind"
        value={String(record[discriminator] ?? current.properties?.[discriminator]?.const ?? '')}
        onChange={event => change(event.target.value)}
        disabled={disabled}
        sx={{ maxWidth: 240 }}
      >
        {variants.map(variant => {
          const kind = String(variant.properties?.[discriminator]?.const ?? '');
          return (
            <MenuItem key={kind} value={kind}>
              {variant.title ?? labelFor(kind)}
            </MenuItem>
          );
        })}
      </TextField>
      <ObjectField schema={rest} value={record} path={path} name="" bare />
      {schema.description && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {schema.description}
        </Typography>
      )}
    </Stack>
  );
}

// ─── Boxes ─────────────────────────────────────────────────────────────────

function TextBox({
  schema,
  value,
  path,
  name,
  multiline,
  nullable,
  label,
}: {
  schema: JsonSchema;
  value: unknown;
  path: string;
  name: string;
  multiline: boolean;
  nullable: boolean;
  label?: string;
}) {
  const { onChange, disabled, errors, icons } = useEditor();
  const text = typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
  const title = label ?? labelFor(name, schema);
  const required = !nullable && (schema.minLength ?? 0) > 0;
  const emptyNote = nullable && !/empty/i.test(schema.description ?? '') ? 'Leave empty for none.' : undefined;
  const set = (next: string) => onChange(path, nullable && next === '' ? null : next);

  if (schema.widget === 'icon') {
    return (
      <Autocomplete
        size="small"
        options={icons}
        value={text || null}
        disabled={disabled}
        onChange={(_event, next) => onChange(path, next ?? '')}
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            required={required}
            error={Boolean(errors[path])}
            helperText={errors[path] ?? (icons.includes(text) || !text ? schema.description : `“${text}” is not one the site draws — it shows a plain circle.`)}
          />
        )}
      />
    );
  }

  if (schema.widget === 'date') {
    return (
      <TextField
        size="small"
        type="date"
        fullWidth
        label={title}
        value={text.slice(0, 10)}
        disabled={disabled}
        onChange={event => set(event.target.value)}
        error={Boolean(errors[path])}
        helperText={helper(errors, path, schema, emptyNote)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    );
  }

  return (
    <TextField
      size="small"
      fullWidth
      label={title}
      value={text}
      required={required}
      disabled={disabled}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      onChange={event => set(event.target.value)}
      error={Boolean(errors[path])}
      helperText={helper(errors, path, schema, emptyNote)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}

function EnumBox({ schema, options, value, path, name }: { schema: JsonSchema; options: string[]; value: unknown; path: string; name: string }) {
  const { onChange, disabled, errors } = useEditor();
  const current = typeof value === 'string' && options.includes(value) ? value : String(schema.default ?? options[0] ?? '');
  return (
    <TextField
      select
      size="small"
      fullWidth
      label={labelFor(name, schema)}
      value={current}
      disabled={disabled}
      onChange={event => onChange(path, event.target.value)}
      error={Boolean(errors[path])}
      helperText={helper(errors, path, schema)}
    >
      {options.map(option => (
        <MenuItem key={option} value={option}>
          {labelFor(option)}
        </MenuItem>
      ))}
    </TextField>
  );
}

function NumberBox({ schema, value, path, name, integer }: { schema: JsonSchema; value: unknown; path: string; name: string; integer: boolean }) {
  const { onChange, disabled, errors } = useEditor();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (typeof value === 'number' ? String(value) : '');
  return (
    <TextField
      size="small"
      fullWidth
      type="number"
      label={labelFor(name, schema)}
      value={shown}
      disabled={disabled}
      onChange={event => {
        const raw = event.target.value;
        setDraft(raw);
        const parsed = integer ? Number.parseInt(raw, 10) : Number.parseFloat(raw);
        if (Number.isFinite(parsed)) onChange(path, parsed);
      }}
      onBlur={() => setDraft(null)}
      error={Boolean(errors[path])}
      helperText={helper(errors, path, schema)}
      slotProps={{ htmlInput: { min: schema.minimum, max: schema.maximum, step: integer ? 1 : 'any' }, inputLabel: { shrink: true } }}
    />
  );
}

function BooleanBox({ schema, value, path, name }: { schema: JsonSchema; value: unknown; path: string; name: string }) {
  const { onChange, disabled, errors } = useEditor();
  return (
    <Stack>
      <FormControlLabel
        control={<Switch checked={value === true} disabled={disabled} onChange={(_event, checked) => onChange(path, checked)} />}
        label={labelFor(name, schema)}
      />
      {(errors[path] || schema.description) && (
        <Typography variant="caption" sx={{ color: errors[path] ? 'error.main' : 'text.secondary', pl: 1 }}>
          {errors[path] ?? schema.description}
        </Typography>
      )}
    </Stack>
  );
}

/** Twenty-four step counts, typed as one line. */
function NumbersBox({ value, path, schema, name }: { value: number[]; path: string; schema: JsonSchema; name: string }) {
  const { onChange, disabled, errors } = useEditor();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value.join(', ');
  const parts = shown.split(/[\s,]+/).filter(Boolean);
  const numbers = parts.map(Number);
  const valid = numbers.every(n => Number.isInteger(n) && n >= 0);
  const count = schema.minItems !== undefined && schema.minItems === schema.maxItems ? schema.minItems : null;
  const problem = !valid ? 'Whole numbers only, separated by commas.' : count !== null && numbers.length !== count ? `${numbers.length} of ${count} numbers.` : null;
  return (
    <TextField
      size="small"
      fullWidth
      multiline
      label={labelFor(name, schema)}
      value={shown}
      disabled={disabled}
      onChange={event => {
        const raw = event.target.value;
        setDraft(raw);
        const next = raw.split(/[\s,]+/).filter(Boolean).map(Number);
        if (next.every(n => Number.isInteger(n) && n >= 0)) onChange(path, next);
      }}
      onBlur={() => setDraft(null)}
      error={Boolean(errors[path] || problem)}
      helperText={errors[path] ?? problem ?? schema.description}
    />
  );
}

/** Help-centre questions, picked and ordered. */
function FaqPicker({ value, path, schema, name }: { value: string[]; path: string; schema: JsonSchema; name: string }) {
  const { onChange, disabled, errors, faqOptions } = useEditor();
  const byId = new Map(faqOptions.map(option => [option.id, option]));
  return (
    <Autocomplete
      multiple
      size="small"
      options={faqOptions.map(option => option.id)}
      value={value}
      disabled={disabled}
      filterSelectedOptions
      onChange={(_event, next) => onChange(path, next)}
      getOptionLabel={id => byId.get(id)?.question ?? id}
      renderOption={(props, id) => {
        const option = byId.get(id);
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <li key={key} {...rest}>
            <Stack>
              <Typography variant="body2">{option?.question ?? id}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {option?.category}
                {option && !option.active ? ' · hidden in the Help centre — not shown' : ''}
              </Typography>
            </Stack>
          </li>
        );
      }}
      renderValue={(selected, getItemProps) =>
        selected.map((id, index) => {
          const { key, ...rest } = getItemProps({ index });
          const option = byId.get(id);
          return (
            <Chip
              key={key}
              {...rest}
              size="small"
              color={option && !option.active ? 'warning' : 'default'}
              label={`${index + 1}. ${option?.question ?? `${id} (missing)`}`}
            />
          );
        })
      }
      renderInput={params => (
        <TextField
          {...params}
          label={labelFor(name, schema)}
          error={Boolean(errors[path])}
          helperText={errors[path] ?? schema.description}
        />
      )}
    />
  );
}

/** Anything the shapes above do not cover, as JSON — never a hole in the form. */
function RawBox({ schema, value, path, name }: { schema: JsonSchema; value: unknown; path: string; name: string }) {
  const { onChange, disabled, errors } = useEditor();
  const [draft, setDraft] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  return (
    <TextField
      size="small"
      fullWidth
      multiline
      minRows={3}
      label={`${labelFor(name, schema)} (JSON)`}
      value={draft ?? JSON.stringify(value ?? null, null, 2)}
      disabled={disabled}
      onChange={event => {
        setDraft(event.target.value);
        try {
          onChange(path, JSON.parse(event.target.value));
          setBad(false);
        } catch {
          setBad(true);
        }
      }}
      onBlur={() => setDraft(null)}
      error={bad || Boolean(errors[path])}
      helperText={bad ? 'Not valid JSON yet.' : helper(errors, path, schema)}
      slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
    />
  );
}
