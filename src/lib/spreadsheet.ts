import 'server-only';

import ExcelJS from 'exceljs';

/**
 * Reading a spreadsheet somebody uploaded.
 *
 * The panel does this rather than the API, and on purpose: the API is JSON
 * end to end, and a binary upload would be the one route that is not. So
 * the file is read here, turned into rows, and sent on as JSON the same way
 * a typed-in form would be — which also means the same import endpoint can
 * be driven by a script, and the panel can show what the sheet *says*
 * before anything is written.
 *
 * `.xlsx` is a zip of XML and needs a reader; `.csv` is read here, because
 * pulling in a parser for "split on commas, mind the quotes" is not worth
 * the dependency.
 */

export type SheetRow = {
  /** The row's own number in the sheet, so a refusal can name the line to fix. */
  line: number;
  /** Header (lower-cased, trimmed) → the cell's text. */
  values: Record<string, string>;
};

export type Sheet = {
  /** The sheet the rows came from, as the file names it. */
  name: string;
  /** The header row, as typed — for telling somebody which columns were found. */
  headers: string[];
  rows: SheetRow[];
};

export class SheetError extends Error {}

const SPREADSHEET = /\.(xlsx|xlsm)$/i;
const DELIMITED = /\.(csv|tsv|txt)$/i;

/** 25 MB: a food library is thousands of rows of short text, not a photo album. */
export const MAX_SHEET_BYTES = 25 * 1024 * 1024;

/**
 * The key a column is looked up by.
 *
 * Everything but letters and digits goes, because a header in the wild is
 * "Energy (kcal)", "Protein (g)", "Quick-Add" and "FIBRE " for what the
 * mapping calls energykcal, proteing, quickadd and fibre. Case, spacing and
 * punctuation are not the operator's problem.
 */
export const headerKey = (header: string): string => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * One cell as text.
 *
 * ExcelJS hands back whatever the cell holds — a number, a date, a formula
 * with its cached result, rich text in pieces. All of it ends up as the
 * string the mapping layer then reads, because "104" typed as text and 104
 * typed as a number are the same calorie count to everybody but a parser.
 */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const cell = value as unknown as Record<string, unknown>;
    if ('text' in cell && typeof cell.text === 'string') return cell.text.trim();
    if ('result' in cell) return cellText(cell.result as ExcelJS.CellValue);
    if ('richText' in cell && Array.isArray(cell.richText)) {
      return (cell.richText as { text?: string }[]).map(part => part.text ?? '').join('').trim();
    }
    if ('hyperlink' in cell && typeof cell.hyperlink === 'string') return cell.hyperlink;
  }
  return String(value).trim();
}

/** A delimited line, quotes and doubled quotes honoured. */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else quoted = false;
      } else value += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === delimiter) {
      out.push(value.trim());
      value = '';
    } else value += char;
  }
  out.push(value.trim());
  return out;
}

function readDelimited(text: string, name: string): Sheet {
  // A `.csv` exported from a spreadsheet on a machine set to a comma decimal
  // separator is semicolon-delimited, and a `.tsv` is tabs. Whichever
  // appears most in the header line is the one.
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const first = lines.find(line => line.trim().length > 0);
  if (!first) throw new SheetError('That file has nothing in it.');
  const delimiter = [',', ';', '\t'].reduce((best, candidate) =>
    first.split(candidate).length > first.split(best).length ? candidate : best,
  );

  const headers = splitLine(first, delimiter);
  const headerAt = lines.indexOf(first);
  const rows: SheetRow[] = [];
  for (let index = headerAt + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().length === 0) continue;
    const cells = splitLine(line, delimiter);
    const values: Record<string, string> = {};
    headers.forEach((header, at) => {
      values[headerKey(header)] = cells[at] ?? '';
    });
    rows.push({ line: index + 1, values });
  }
  return { name, headers, rows };
}

async function readWorkbook(buffer: ArrayBuffer): Promise<Sheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  // The first sheet with anything in it: a file exported from somewhere else
  // often carries an empty "Sheet2" behind the real one.
  const sheet = workbook.worksheets.find(candidate => candidate.rowCount > 1) ?? workbook.worksheets[0];
  if (!sheet) throw new SheetError('That workbook has no sheets in it.');

  let headers: string[] = [];
  let headerAt = 0;
  const rows: SheetRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: string[] = [];
    // `row.eachCell` skips empty cells, which would shift every column after
    // a blank one; indexing by column number keeps them lined up.
    for (let column = 1; column <= (sheet.columnCount || row.cellCount); column += 1) {
      cells.push(cellText(row.getCell(column).value));
    }
    if (headers.length === 0) {
      if (cells.every(cell => cell === '')) return;
      headers = cells;
      headerAt = rowNumber;
      return;
    }
    if (rowNumber <= headerAt) return;
    if (cells.every(cell => cell === '')) return;
    const values: Record<string, string> = {};
    headers.forEach((header, at) => {
      if (header.trim().length > 0) values[headerKey(header)] = cells[at] ?? '';
    });
    rows.push({ line: rowNumber, values });
  });

  return { name: sheet.name, headers: headers.filter(header => header.trim().length > 0), rows };
}

/**
 * The uploaded file as a header row and the rows under it.
 *
 * Throws `SheetError` with something an operator can act on — the file is
 * theirs and the fix is in it, so "that is a .pdf" beats a stack trace.
 */
export async function readSheet(file: File): Promise<Sheet> {
  if (file.size === 0) throw new SheetError('That file is empty.');
  if (file.size > MAX_SHEET_BYTES) {
    throw new SheetError(`That file is ${Math.round(file.size / 1024 / 1024)} MB; the limit is 25 MB.`);
  }

  const name = file.name || 'sheet';
  if (DELIMITED.test(name)) return readDelimited(await file.text(), name);
  if (!SPREADSHEET.test(name)) {
    throw new SheetError(`“${name}” is not a spreadsheet — save it as .xlsx or .csv and try again.`);
  }
  try {
    return await readWorkbook(await file.arrayBuffer());
  } catch (error) {
    if (error instanceof SheetError) throw error;
    throw new SheetError(
      `That .xlsx could not be read${error instanceof Error && error.message ? ` — ${error.message}` : ''}. Re-saving it from Excel or Sheets usually fixes it.`,
    );
  }
}

/**
 * The first column whose header matches one of `names`.
 *
 * Spreadsheets in the wild say "Calories", "kcal", "Energy (kcal)" and
 * "CALORIES " for the same column, so the aliases are the mapping and the
 * header row is not something the operator has to get exactly right.
 */
export function pick(row: SheetRow, names: string[]): string {
  for (const name of names) {
    const value = row.values[headerKey(name)];
    if (value !== undefined && value !== '') return value;
  }
  return '';
}
