import zlib from "zlib";

export interface RawBulkExpenseRow {
  excelRowNumber: number;
  srNo: string;
  name: string;
  amount: string;
  category: string;
  type: string;
  expenseDate: string;
}

export interface ValidatedBulkExpenseRow {
  excelRowNumber: number;
  srNo: number;
  name: string;
  amount: number;
  categoryName: string;
  categoryId: number | null;
  isDefaultCategory: boolean;
  type: "Fixed" | "Variable";
  expenseDate: string; // YYYY-MM-DD
}

export interface BulkRowValidationError {
  excelRowNumber: number;
  srNo: string | number;
  column: string;
  message: string;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/_x000D_/gi, "\r")
    .replace(/_x000A_/gi, "\n")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function extractZipEntries(buf: Buffer): Record<string, string> {
  if (!buf || buf.length < 22 || buf.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("Invalid file format. Please upload a valid .xlsx Excel template file.");
  }

  const entries: Record<string, string> = {};

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const minSearchOffset = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minSearchOffset; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const cdCount = buf.readUInt16LE(eocdOffset + 10);
    let cdOffset = buf.readUInt32LE(eocdOffset + 16);

    for (let i = 0; i < cdCount; i++) {
      if (cdOffset + 46 > buf.length || buf.readUInt32LE(cdOffset) !== 0x02014b50) break;
      const method = buf.readUInt16LE(cdOffset + 10);
      const compSize = buf.readUInt32LE(cdOffset + 20);
      const nameLen = buf.readUInt16LE(cdOffset + 28);
      const extraLen = buf.readUInt16LE(cdOffset + 30);
      const commentLen = buf.readUInt16LE(cdOffset + 32);
      const localHeaderOffset = buf.readUInt32LE(cdOffset + 42);

      const name = buf.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString("utf8");
      if (name.endsWith(".xml") || name.endsWith(".rels")) {
        const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
        const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const compData = buf.subarray(dataStart, dataStart + compSize);
        const raw = method === 0 ? compData : zlib.inflateRawSync(compData);
        entries[name] = raw.toString("utf8");
      }

      cdOffset += 46 + nameLen + extraLen + commentLen;
    }
  } else {
    // Fallback to sequential local file headers
    let offset = 0;
    while (offset + 30 <= buf.length) {
      if (buf.readUInt32LE(offset) !== 0x04034b50) break;
      const method = buf.readUInt16LE(offset + 8);
      const compSize = buf.readUInt32LE(offset + 18);
      const nameLen = buf.readUInt16LE(offset + 26);
      const extraLen = buf.readUInt16LE(offset + 28);
      const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
      const dataStart = offset + 30 + nameLen + extraLen;
      const compData = buf.subarray(dataStart, dataStart + compSize);
      if (name.endsWith(".xml") || name.endsWith(".rels")) {
        const raw = method === 0 ? compData : zlib.inflateRawSync(compData);
        entries[name] = raw.toString("utf8");
      }
      offset = dataStart + compSize;
    }
  }

  return entries;
}

function parseSharedStrings(xml?: string): string[] {
  if (!xml) return [];
  const strings: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let siMatch: RegExpExecArray | null;

  while ((siMatch = siRegex.exec(xml)) !== null) {
    const siContent = siMatch[1].replace(/<rPh\b[^>]*>[\s\S]*?<\/rPh>/g, "");
    const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g;
    let tMatch: RegExpExecArray | null;
    let combined = "";
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      combined += decodeXmlEntities(tMatch[1]);
    }
    strings.push(combined);
  }
  return strings;
}

export function excelSerialToDateString(serial: number): string {
  // Excel's 1900 date system offset to Unix epoch (1970-01-01) is 25569 days
  const utcDays = Math.round(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  const dateObj = new Date(utcMs);
  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function colLettersToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1; // 0-based (A=0, B=1, C=2, D=3, E=4, F=5)
}

export function parseBulkExpenseXlsx(buffer: Buffer): RawBulkExpenseRow[] {
  const entries = extractZipEntries(buffer);
  const sheetXml =
    entries["xl/worksheets/sheet1.xml"] ||
    Object.keys(entries)
      .filter((k) => k.startsWith("xl/worksheets/sheet") && k.endsWith(".xml"))
      .sort()[0] &&
      entries[
        Object.keys(entries)
          .filter((k) => k.startsWith("xl/worksheets/sheet") && k.endsWith(".xml"))
          .sort()[0]
      ];

  if (!sheetXml) {
    throw new Error("No worksheet found in the uploaded Excel file.");
  }

  const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);

  // Parse all rows into a map: rowNum -> string[6]
  const rowsMap = new Map<number, string[]>();
  const rowRegex = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  let autoRowCounter = 0;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowAttrs = rowMatch[1];
    const rowBody = rowMatch[2];
    const rAttrMatch = /\br="(\d+)"/.exec(rowAttrs);
    const rowNum = rAttrMatch ? parseInt(rAttrMatch[1], 10) : ++autoRowCounter;
    autoRowCounter = rowNum;

    const cells: string[] = ["", "", "", "", "", ""];
    const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch: RegExpExecArray | null;
    let autoColCounter = 0;

    while ((cellMatch = cellRegex.exec(rowBody)) !== null) {
      const cellAttrs = cellMatch[1];
      const cellContent = cellMatch[2] || "";

      const cellRefMatch = /\br="([A-Z]+)\d+"/.exec(cellAttrs);
      const colIdx = cellRefMatch ? colLettersToIndex(cellRefMatch[1]) : autoColCounter;
      autoColCounter = colIdx + 1;

      if (colIdx < 0 || colIdx > 5) continue;

      const typeMatch = /\bt="([^"]+)"/.exec(cellAttrs);
      const cellType = typeMatch ? typeMatch[1] : "n";

      let val = "";
      if (cellType === "inlineStr") {
        const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g;
        let tMatch: RegExpExecArray | null;
        while ((tMatch = tRegex.exec(cellContent)) !== null) {
          val += decodeXmlEntities(tMatch[1]);
        }
      } else {
        const vMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cellContent);
        const rawV = vMatch ? decodeXmlEntities(vMatch[1]).trim() : "";
        if (cellType === "s") {
          const ssIdx = parseInt(rawV, 10);
          val = !isNaN(ssIdx) && sharedStrings[ssIdx] !== undefined ? sharedStrings[ssIdx] : rawV;
        } else {
          val = rawV;
        }
      }

      // If this is the Expense Date column (colIdx === 5) and Excel stored a numeric date serial
      if (colIdx === 5 && cellType === "n" && val !== "") {
        const numVal = Number(val);
        if (!isNaN(numVal) && numVal >= 25569 && numVal <= 73050 && /^\d+(\.\d+)?$/.test(val)) {
          val = excelSerialToDateString(numVal);
        }
      }

      cells[colIdx] = val.trim();
    }

    rowsMap.set(rowNum, cells);
  }

  // Locate header row (Row 4 in the template, or scan first 10 rows)
  const expectedHeaders = [
    "sr. no.",
    "expense name",
    "expense amount",
    "expense category",
    "expense type",
    "expense date",
  ];

  let headerRowNum = -1;
  const sortedRowNums = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  for (const rNum of sortedRowNums) {
    if (rNum > 10) break;
    const cols = rowsMap.get(rNum)!;
    const normalized = cols.map((c) => c.toLowerCase().trim());
    const matchesHeader =
      normalized[1] === "expense name" &&
      normalized[2] === "expense amount" &&
      normalized[3] === "expense category" &&
      normalized[4] === "expense type" &&
      normalized[5] === "expense date" &&
      (normalized[0] === "sr. no." || normalized[0] === "sr no" || normalized[0] === "sr.no.");

    if (matchesHeader) {
      headerRowNum = rNum;
      break;
    }
  }

  if (headerRowNum === -1) {
    throw new Error(
      `Invalid template format. Expected column headers: ${expectedHeaders
        .map((h) => h.replace(/\b\w/g, (c) => c.toUpperCase()))
        .join(", ")}. Please use the official BULK EXPENSE CREATION TEMPLATE.xlsx file.`
    );
  }

  const dataRows: RawBulkExpenseRow[] = [];
  for (const rNum of sortedRowNums) {
    if (rNum <= headerRowNum) continue;
    const cols = rowsMap.get(rNum)!;
    const [srNo, name, amount, category, type, expenseDate] = cols;

    // Skip rows where all data columns (B through F) AND Sr. No. are empty,
    // or where all main expense columns (B through F) are completely empty.
    const hasExpenseData = [name, amount, category, type, expenseDate].some((v) => v !== "");
    if (!hasExpenseData) {
      continue;
    }

    dataRows.push({
      excelRowNumber: rNum,
      srNo,
      name,
      amount,
      category,
      type,
      expenseDate,
    });
  }

  if (dataRows.length === 0) {
    throw new Error(
      "The uploaded template contains no expense data rows. Please enter at least one expense record."
    );
  }

  return dataRows;
}

export function parseAndValidateDate(rawDate: string): { valid: boolean; normalizedDate?: string } {
  const trimmed = rawDate.trim();
  if (!trimmed) return { valid: false };

  let year = 0;
  let month = 0;
  let day = 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const parts = trimmed.split("-");
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else {
    return { valid: false };
  }

  if (year < 1970 || year > 2100) return { valid: false };
  if (month < 1 || month > 12) return { valid: false };

  const daysInMonths = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (day < 1 || day > daysInMonths[month - 1]) {
    return { valid: false };
  }

  const normalizedDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  return { valid: true, normalizedDate };
}
