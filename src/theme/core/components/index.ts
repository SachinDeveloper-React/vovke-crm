import type { ThemeComponents } from '../../types';

import { alert } from './alert';
import { autocomplete } from './autocomplete';
import { backdrop } from './backdrop';
import { button } from './button';
import { card } from './card';
import { checkbox } from './checkbox';
import { chip } from './chip';
import { cssBaseline } from './css-baseline';
import { dialog } from './dialog';
import { iconButton } from './icon-button';
import { menu } from './menu';
import { paper } from './paper';
import { radio } from './radio';
import { switches } from './switch';
import { table } from './table';
import { tabs } from './tabs';
import { textField } from './text-field';
import { tooltip } from './tooltip';

// ----------------------------------------------------------------------

export const components: ThemeComponents = {
  ...alert,
  ...autocomplete,
  ...backdrop,
  ...button,
  ...card,
  ...checkbox,
  ...chip,
  ...cssBaseline,
  ...dialog,
  ...iconButton,
  ...menu,
  ...paper,
  ...radio,
  ...switches,
  ...table,
  ...tabs,
  ...textField,
  ...tooltip,
};

// ----------------------------------------------------------------------

export {
  alert,
  autocomplete,
  backdrop,
  button,
  card,
  checkbox,
  chip,
  cssBaseline,
  dialog,
  iconButton,
  menu,
  paper,
  radio,
  switches,
  table,
  tabs,
  textField,
  tooltip,
};
