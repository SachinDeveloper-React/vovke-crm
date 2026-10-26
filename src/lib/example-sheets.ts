import ExcelJS from 'exceljs';

/**
 * The example sheets, built from the same column names the importers read.
 *
 * Server side by use rather than by `server-only`, deliberately: the
 * `npm run examples` script builds the same files from the same lists, and
 * a marker module that only Next's bundler can resolve would make that
 * script impossible. Nothing in here is private — it is a blank template —
 * and the two importers of it are a route handler and that script.
 *
 * Generated rather than kept as two files in `public/`, and that is the
 * whole point: a file checked in beside the code drifts the first time a
 * column is added, and an operator filling in a stale template finds out
 * only when half their rows are skipped. These are built on request from
 * the lists below, so the example a person downloads is always the format
 * the importer accepts this minute.
 *
 * Each workbook has two sheets. The first is the data — a header row and a
 * few rows filled in, so it can be used as the template by typing over
 * them. The second says, column by column, whether it is needed, what it
 * means and what the importer will refuse, because "Price (₹)" needs no
 * explanation and "Payment mode" needs three lines of one.
 */

/** One column of an example sheet: the header, the help, and the rows. */
interface Column {
  header: string;
  /** How wide to draw it. */
  width: number;
  needed: 'Yes' | 'No';
  /** What it is for, and what the importer refuses — plain English. */
  note: string;
  /** Excel number format, where the cell is a figure rather than text. */
  format?: string;
  values: (string | number | null)[];
}

const HEADER_FILL = 'FFEDF3FF';
const NOTE_FILL = 'FFF6F7F9';

/**
 * The products sheet.
 *
 * Prices are rupees here and paise on the wire: the panel is the only place
 * rupees are written, and a column headed "Price (₹)" is the one an
 * operator already has in the file they keep.
 */
const PRODUCT_COLUMNS: Column[] = [
  {
    header: 'ID',
    width: 22,
    needed: 'No',
    note: 'The slug the product is matched by — lowercase letters, numbers and hyphens (travel-bottle). Leave it blank and one is made from the name. Keep it the same to correct a product on the next import instead of listing it twice.',
    values: ['travel-bottle', 'resistance-band-set', 'vokve-tee-black', '', ''],
  },
  {
    header: 'Name',
    width: 30,
    needed: 'Yes',
    note: 'What members see. A row with no name is skipped.',
    values: [
      'Vokve Travel Bottle 750ml',
      'Resistance Band Set',
      'Vokve Tee — Black',
      'Yoga Mat 6mm',
      'Shaker Bottle 700ml',
    ],
  },
  {
    header: 'Description',
    width: 46,
    needed: 'No',
    note: 'The paragraph on the product page. Up to 2,000 characters.',
    values: [
      'Double-walled steel bottle that keeps water cold for 24 hours.',
      'Five bands, light to heavy, with a door anchor and a carry bag.',
      'Combed cotton, pre-shrunk, with the wordmark on the chest.',
      'Non-slip TPE mat with a carry strap.',
      'Leak-proof shaker with a steel whisk ball.',
    ],
  },
  {
    header: 'Price (₹)',
    width: 12,
    needed: 'Yes',
    note: 'What it sells for, in rupees. Above zero, up to ₹10,00,000. “₹1,299.00” and “1,299” both read as 1299. A row with no price is skipped.',
    format: '#,##0.00',
    values: [1299, 899, 699, 1499, 449],
  },
  {
    header: 'MRP (₹)',
    width: 12,
    needed: 'No',
    note: 'The struck-through list price. Must be the same as the price or above it — an MRP below the price would show a member a negative discount, and the row is refused.',
    format: '#,##0.00',
    values: [1799, 1299, 999, 2199, 599],
  },
  {
    header: 'Coin price',
    width: 12,
    needed: 'No',
    note: 'What it costs when coins pay all of it. Leave it blank and the rupee price is divided out at ⚙ commerce.coinValuePaise, which is what the till does anyway.',
    format: '#,##0',
    values: [null, null, 2000, null, null],
  },
  {
    header: 'Category',
    width: 16,
    needed: 'Yes',
    note: 'The shelf, by its slug. It has to exist already — add it on Shelves & subcategories first. A row naming a shelf that is not there is refused, and the refusal lists the shelves that are.',
    values: ['gym', 'gym', 'clothing', 'gym', 'accessories'],
  },
  {
    header: 'Subcategory',
    width: 18,
    needed: 'No',
    note: 'A subcategory of that shelf, by name. It has to exist on the shelf, and the refusal says which ones do.',
    values: ['Bottles', 'Training', 'T-shirts', '', ''],
  },
  {
    header: 'Payment mode',
    width: 16,
    needed: 'No',
    note: 'coins, money or mixed. “both” reads as mixed, “cash” and “rupees” as money. Leave it blank (or write “shop”) and it follows ⚙ commerce.paymentMode. Anything else is refused.',
    values: ['money', 'mixed', 'coins', '', 'money'],
  },
  {
    header: 'Stock',
    width: 10,
    needed: 'No',
    note: 'Units on hand. Nobody lists a thing they have none of, so this is written straight to inventory.',
    format: '#,##0',
    values: [40, 120, 65, 25, 150],
  },
  {
    header: 'Low stock at',
    width: 13,
    needed: 'No',
    note: 'The level the panel starts warning at.',
    format: '#,##0',
    values: [10, 20, 15, 5, 25],
  },
  {
    header: 'Image URL',
    width: 40,
    needed: 'No',
    note: 'The main photo, as a full https link.',
    values: [
      'https://cdn.vokve.com/shop/travel-bottle.jpg',
      'https://cdn.vokve.com/shop/bands.jpg',
      'https://cdn.vokve.com/shop/tee-black.jpg',
      '',
      '',
    ],
  },
  {
    header: 'Images',
    width: 40,
    needed: 'No',
    note: 'More photos, up to ten, separated by | (a vertical bar).',
    values: [
      'https://cdn.vokve.com/shop/travel-bottle-2.jpg | https://cdn.vokve.com/shop/travel-bottle-3.jpg',
      '',
      '',
      '',
      '',
    ],
  },
  {
    header: 'Badge',
    width: 14,
    needed: 'No',
    note: 'bestseller, popular, new_arrival or limited — the four the app can draw. Anything else is refused rather than drawn as a blank chip.',
    values: ['bestseller', '', 'new_arrival', '', 'popular'],
  },
  {
    header: 'Ribbon',
    width: 16,
    needed: 'No',
    note: 'A short strip across the card — “Save ₹500”.',
    values: ['Save ₹500', '', '', '', ''],
  },
  {
    header: 'Deal',
    width: 8,
    needed: 'No',
    note: 'yes / no. Puts it in the deals row.',
    values: ['yes', 'no', 'no', 'no', 'no'],
  },
  {
    header: 'Featured',
    width: 10,
    needed: 'No',
    note: 'yes / no. Lifts it onto the shop’s front.',
    values: ['yes', 'no', 'yes', 'no', 'no'],
  },
  {
    header: 'Tags',
    width: 28,
    needed: 'No',
    note: 'What members would search for, separated by | or commas. Up to twenty.',
    values: ['bottle | steel | travel', 'bands | home workout', 'tee | cotton', 'mat | yoga', 'shaker | protein'],
  },
  {
    header: 'Sizes',
    width: 20,
    needed: 'No',
    note: 'Separated by | or commas — S | M | L | XL.',
    values: ['', '', 'S | M | L | XL', '', ''],
  },
  {
    header: 'Colours',
    width: 30,
    needed: 'No',
    note: 'Name and hex together — “Black #111111 | Steel #c0c7d0”. A colour with no hex is left out, since the app draws a swatch.',
    values: ['Steel #c0c7d0 | Black #111111', '', 'Black #111111', '', ''],
  },
  {
    header: 'Sort',
    width: 8,
    needed: 'No',
    note: 'Lower sorts first on the shelf.',
    format: '#,##0',
    values: [1, 2, 3, 4, 5],
  },
  {
    header: 'Active',
    width: 9,
    needed: 'No',
    note: 'yes / no. “no” lists it without putting it on the member’s shelf — useful for staging a launch.',
    values: ['yes', 'yes', 'yes', 'yes', 'no'],
  },
];

/**
 * The meals sheet — the food library members search, browse and quick-add
 * from (RULES N8). Matched by name, not by an id.
 */
const MEAL_COLUMNS: Column[] = [
  {
    header: 'Name',
    width: 28,
    needed: 'Yes',
    note: 'What it is called, and what a member’s search matches. This is also the key: importing the same name again corrects that food rather than adding a second one. A row with no name is skipped.',
    values: ['Oats (Cooked)', 'Boiled Egg', 'Paneer Bhurji', 'Masala Dosa', 'Grilled Chicken Breast'],
  },
  {
    header: 'Portion',
    width: 22,
    needed: 'No',
    note: 'The helping the figures are for. Every calorie below is per this. Blank reads as “1 serving”.',
    values: ['1 cup (150 g)', '1 large (50 g)', '1 bowl (150 g)', '1 dosa (120 g)', '100 g'],
  },
  {
    header: 'Calories (kcal)',
    width: 15,
    needed: 'Yes',
    note: 'Per portion. “104 kcal” and “104” both read as 104. A row the calories cannot be read from is skipped — it is the one figure the whole diary adds up.',
    format: '#,##0',
    values: [150, 78, 215, 168, 165],
  },
  {
    header: 'Protein (g)',
    width: 12,
    needed: 'No',
    note: 'Per portion. Blank reads as 0.',
    format: '#,##0.0',
    values: [5, 6, 14, 4, 31],
  },
  {
    header: 'Carbs (g)',
    width: 12,
    needed: 'No',
    note: 'Per portion. Blank reads as 0.',
    format: '#,##0.0',
    values: [27, 0.6, 6, 25, 0],
  },
  {
    header: 'Fat (g)',
    width: 11,
    needed: 'No',
    note: 'Per portion. Blank reads as 0.',
    format: '#,##0.0',
    values: [3, 5, 16, 6, 3.6],
  },
  {
    header: 'Fibre (g)',
    width: 11,
    needed: 'No',
    note: 'Per portion. Blank reads as 0.',
    format: '#,##0.0',
    values: [4, 0, 2, 2, 0],
  },
  {
    header: 'Emoji',
    width: 8,
    needed: 'No',
    note: 'One character, drawn beside the name where there is no photo.',
    values: ['🥣', '🥚', '🧀', '🥞', '🍗'],
  },
  {
    header: 'Quick add',
    width: 11,
    needed: 'No',
    note: 'yes / no. A quick-add food gets a tile on the Add Meal screen, so keep it for the handful people log every day.',
    values: ['yes', 'yes', 'no', 'no', 'no'],
  },
  {
    header: 'Sort',
    width: 8,
    needed: 'No',
    note: 'Lower sorts first in the library.',
    format: '#,##0',
    values: [1, 2, 3, 4, 5],
  },
  {
    header: 'Active',
    width: 9,
    needed: 'No',
    note: 'yes / no. “no” retires it: out of search, the quick-add row and the library, while what members already logged stays exactly as it was.',
    values: ['yes', 'yes', 'yes', 'yes', 'yes'],
  },
];

function fill(sheet: ExcelJS.Worksheet, columns: Column[]): void {
  sheet.columns = columns.map(column => ({ header: column.header, width: column.width }));

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  header.alignment = { vertical: 'middle' };
  header.height = 22;
  // So the header stays put while somebody fills in two hundred rows.
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const rowCount = Math.max(...columns.map(column => column.values.length));
  for (let index = 0; index < rowCount; index += 1) {
    const row = sheet.addRow(columns.map(column => column.values[index] ?? null));
    columns.forEach((column, at) => {
      if (column.format) row.getCell(at + 1).numFmt = column.format;
    });
  }

  columns.forEach((column, at) => {
    const cell = sheet.getRow(1).getCell(at + 1);
    // The help travels with the file: a column whose rule is not obvious
    // says so when the cursor is on it, as well as on the sheet behind.
    cell.note = `${column.needed === 'Yes' ? 'Needed. ' : 'Optional. '}${column.note}`;
  });

}

function explain(sheet: ExcelJS.Worksheet, columns: Column[], intro: string[]): void {
  sheet.columns = [
    { header: 'Column', width: 18 },
    { header: 'Needed?', width: 10 },
    { header: 'What it means, and what is refused', width: 100 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (const line of intro) {
    const row = sheet.addRow(['', '', line]);
    row.getCell(3).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(3).font = { italic: true };
    row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NOTE_FILL } };
  }
  sheet.addRow([]);

  for (const column of columns) {
    const row = sheet.addRow([column.header, column.needed, column.note]);
    row.getCell(1).font = { bold: true };
    row.getCell(3).alignment = { wrapText: true, vertical: 'top' };
    if (column.needed === 'Yes') row.getCell(2).font = { bold: true };
  }
}

async function workbook(
  name: string,
  columns: Column[],
  intro: string[],
): Promise<ArrayBuffer> {
  const book = new ExcelJS.Workbook();
  book.creator = 'Vokve Admin';
  book.created = new Date();
  fill(book.addWorksheet(name), columns);
  explain(book.addWorksheet('How to fill this in'), columns, intro);
  const buffer = await book.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export function productsExample(): Promise<ArrayBuffer> {
  return workbook('Products', PRODUCT_COLUMNS, [
    'One product per row, under the header row. Type over the five examples or delete them.',
    'Only Name, Price and Category have to be filled in. Everything else may be left blank.',
    'Headers are matched loosely: “Product name”, “NAME ”, “Selling price” and “MRP” all land where you would expect. The order of the columns does not matter.',
    'Products are matched by the ID column, or by a slug made from the name when it is blank — so importing a corrected sheet changes the same products rather than listing them twice.',
    'Press “Check the sheet” first. It says what would change, line by line, and writes nothing.',
  ]);
}

export function mealsExample(): Promise<ArrayBuffer> {
  return workbook('Meals', MEAL_COLUMNS, [
    'One food per row, under the header row. Type over the five examples or delete them.',
    'Only Name and Calories have to be filled in. Everything else may be left blank.',
    'Headers are matched loosely: “Energy (kcal)”, “kcal”, “Carbohydrates” and “Fibre” all land where you would expect, and units in the cell (“104 kcal”, “3.2 g”) are read as numbers.',
    'Foods are matched by name, so importing a corrected sheet changes the same foods rather than adding a second copy of each.',
    'Every figure is per the portion in its own row — 100 g of one thing and a bowl of another is fine.',
    'Press “Check the sheet” first. It says what would change, line by line, and writes nothing.',
  ]);
}

export const EXAMPLE_SHEETS = {
  products: { build: productsExample, filename: 'vokve-products-example.xlsx' },
  meals: { build: mealsExample, filename: 'vokve-meals-example.xlsx' },
} as const;

export type ExampleSheetKind = keyof typeof EXAMPLE_SHEETS;
