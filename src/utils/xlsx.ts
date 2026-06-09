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

function buildWorkbookXml() {
  return `${XML_DECLARATION}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>`;
}

function buildWorkbookRelationshipsXml() {
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
}

function buildRootRelationshipsXml() {
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function buildContentTypesXml() {
  return `${XML_DECLARATION}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
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
