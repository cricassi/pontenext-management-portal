import type { ReportColumn, ReportRow } from "@/types/report";

type ZipEntry = {
  path: string;
  content: Buffer;
};

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const crcTable = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let current = index;

  for (let bit = 0; bit < 8; bit += 1) {
    current =
      current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  }

  crcTable[index] = current >>> 0;
}

function getCrc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getDosTimestamp(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { dosTime, dosDate };
}

function createZip(entries: ZipEntry[]) {
  const fileParts: Buffer[] = [];
  const centralDirectoryParts: Buffer[] = [];
  let offset = 0;
  const { dosTime, dosDate } = getDosTimestamp();

  for (const entry of entries) {
    const fileName = Buffer.from(entry.path, "utf8");
    const crc = getCrc32(entry.content);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(entry.content.length, 18);
    localHeader.writeUInt32LE(entry.content.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    fileParts.push(localHeader, fileName, entry.content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(entry.content.length, 20);
    centralHeader.writeUInt32LE(entry.content.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralDirectoryParts.push(centralHeader, fileName);
    offset += localHeader.length + fileName.length + entry.content.length;
  }

  const centralDirectory = Buffer.concat(centralDirectoryParts);
  const endOfCentralDirectory = Buffer.alloc(22);

  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(entries.length, 8);
  endOfCentralDirectory.writeUInt16LE(entries.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([
    ...fileParts,
    centralDirectory,
    endOfCentralDirectory,
  ]);
}

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getColumnName(index: number) {
  let value = "";
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }

  return value;
}

function stringifyCellValue(value: ReportRow[string]) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function buildCellXml(value: ReportRow[string], rowIndex: number, columnIndex: number) {
  const cellReference = `${getColumnName(columnIndex)}${rowIndex}`;
  const text = escapeXml(stringifyCellValue(value));

  return `<c r="${cellReference}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

function buildColumnWidths(columns: ReportColumn[], rows: ReportRow[]) {
  return columns
    .map((column, index) => {
      const longestValue = rows.reduce((longest, row) => {
        const length = stringifyCellValue(row[column.key]).length;
        return Math.max(longest, length);
      }, column.label.length);
      const width = Math.min(Math.max(longestValue + 2, 12), 42);
      const position = index + 1;

      return `<col min="${position}" max="${position}" width="${width}" customWidth="1"/>`;
    })
    .join("");
}

function buildWorksheetXml(columns: ReportColumn[], rows: ReportRow[]) {
  const headerRow = `<row r="1">${columns
    .map((column, index) => buildCellXml(column.label, 1, index))
    .join("")}</row>`;
  const dataRows = rows
    .map((row, rowIndex) => {
      const position = rowIndex + 2;
      const cells = columns
        .map((column, columnIndex) =>
          buildCellXml(row[column.key], position, columnIndex),
        )
        .join("");

      return `<row r="${position}">${cells}</row>`;
    })
    .join("");

  return `${XML_DECLARATION}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${buildColumnWidths(
    columns,
    rows,
  )}</cols><sheetData>${headerRow}${dataRows}</sheetData></worksheet>`;
}

function buildWorkbookXml(names = ["Report"]) {
  const sheets = names.map((name, index) => `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
  return `${XML_DECLARATION}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets}</sheets></workbook>`;
}

function buildWorkbookRelationshipsXml(count = 1, styles = false) {
  const sheets = Array.from({ length: count }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  const style = styles ? '<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' : "";
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets}${style}</Relationships>`;
}

function buildRootRelationshipsXml() {
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function buildContentTypesXml(count = 1, styles = false) {
  const sheets = Array.from({ length: count }, (_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const style = styles ? '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' : "";
  return `${XML_DECLARATION}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets}${style}</Types>`;
}

function toEntry(path: string, content: string): ZipEntry {
  return {
    path,
    content: Buffer.from(content, "utf8"),
  };
}

export function exportRowsToXlsx(columns: ReportColumn[], rows: ReportRow[]) {
  return createZip([
    toEntry("[Content_Types].xml", buildContentTypesXml()),
    toEntry("_rels/.rels", buildRootRelationshipsXml()),
    toEntry("xl/workbook.xml", buildWorkbookXml()),
    toEntry("xl/_rels/workbook.xml.rels", buildWorkbookRelationshipsXml()),
    toEntry("xl/worksheets/sheet1.xml", buildWorksheetXml(columns, rows)),
  ]);
}

export type XlsxCell = string | number | boolean | null;
export type XlsxSheet = {
  name: string;
  columns: { label: string; money?: boolean }[];
  rows: XlsxCell[][];
};

function buildTypedCell(value: XlsxCell, reference: string, money = false): string {
  if (value === null) return "";
  if (typeof value === "boolean") return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Invalid numeric cell");
    return `<c r="${reference}" t="n"${money ? ' s="2"' : ""}><v>${value}</v></c>`;
  }
  if (value.length > 32767) throw new RangeError("Excel cell limit exceeded");
  for (const character of value) {
    const point = character.codePointAt(0)!;
    if ((point < 32 && point !== 9 && point !== 10 && point !== 13) ||
      (point >= 0xd800 && point <= 0xdfff) || point === 0xfffe || point === 0xffff) {
      throw new Error("Unrepresentable XML character");
    }
  }
  // inlineStr never executes formulas; quotePrefix also flags dangerous text in Excel.
  const style = /^[\s]*[=+\-@]/u.test(value) ? ' s="1"' : "";
  const text = escapeXml(value.replace(/_x[0-9a-f]{4}_/gi, (match) => `_x005F_${match.slice(1)}`))
    .replace(/\r/g, "_x000D_");
  return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${text}</t></is></c>`;
}

export function exportSheetsToXlsx(sheets: XlsxSheet[], maxBytes: number): Buffer {
  const names = new Set<string>();
  for (const sheet of sheets) {
    const name = sheet.name.toLowerCase();
    if (!name || name.length > 31 || /[\\/?*\[\]:]/.test(name) || names.has(name) ||
      sheet.columns.length === 0 || sheet.columns.length > 16384 || sheet.rows.length > 1048575) {
      throw new Error("Invalid worksheet");
    }
    names.add(name);
  }
  if (!sheets.length) throw new Error("Workbook requires worksheets");
  const styles = `${XML_DECLARATION}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" quotePrefix="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const entries = [
    toEntry("[Content_Types].xml", buildContentTypesXml(sheets.length, true)),
    toEntry("_rels/.rels", buildRootRelationshipsXml()),
    toEntry("xl/workbook.xml", buildWorkbookXml(sheets.map((sheet) => sheet.name))),
    toEntry("xl/_rels/workbook.xml.rels", buildWorkbookRelationshipsXml(sheets.length, true)),
    toEntry("xl/styles.xml", styles),
  ];
  let size = entries.reduce((total, entry) => total + entry.content.length, 0);
  for (const [index, sheet] of sheets.entries()) {
    const rows = [sheet.columns.map((column) => column.label), ...sheet.rows];
    const parts = [`${XML_DECLARATION}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>`];
    for (const [rowIndex, row] of rows.entries()) {
      if (row.length !== sheet.columns.length) throw new Error("Column count mismatch");
      const xml = `<row r="${rowIndex + 1}">${row.map((value, columnIndex) =>
        buildTypedCell(value, `${getColumnName(columnIndex)}${rowIndex + 1}`, rowIndex > 0 && sheet.columns[columnIndex].money),
      ).join("")}</row>`;
      size += Buffer.byteLength(xml, "utf8");
      if (size > maxBytes) throw new RangeError("Workbook size exceeded");
      parts.push(xml);
    }
    parts.push("</sheetData></worksheet>");
    entries.push(toEntry(`xl/worksheets/sheet${index + 1}.xml`, parts.join("")));
  }
  const workbook = createZip(entries);
  if (workbook.length > maxBytes) throw new RangeError("Workbook size exceeded");
  return workbook;
}
