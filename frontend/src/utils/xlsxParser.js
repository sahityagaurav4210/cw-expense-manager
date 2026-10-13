import { bulkExpenseRowZodSchema } from "../validators/zodSchemas";

function decodeXmlEntities(str) {
  return String(str || "")
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

async function inflateRawBytes(compressedBytes) {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(compressedBytes);
  writer.close();
  const response = new Response(ds.readable);
  const arrayBuffer = await response.arrayBuffer();
  return new TextDecoder("utf-8").decode(arrayBuffer);
}

async function extractZipEntriesFromBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) {
    throw new Error("Invalid file format. Please upload a valid .xlsx Excel template file.");
  }

  const entries = {};
  const decoder = new TextDecoder("utf-8");

  // Locate End of Central Directory (0x06054b50)
  let eocdOffset = -1;
  const minSearchOffset = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minSearchOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const cdCount = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);

    for (let i = 0; i < cdCount; i++) {
      if (cdOffset + 46 > bytes.length || view.getUint32(cdOffset, true) !== 0x02014b50) break;
      const method = view.getUint16(cdOffset + 10, true);
      const compSize = view.getUint32(cdOffset + 20, true);
      const nameLen = view.getUint16(cdOffset + 28, true);
      const extraLen = view.getUint16(cdOffset + 30, true);
      const commentLen = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);

      const name = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
      if (name.endsWith(".xml") || name.endsWith(".rels")) {
        const localNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const compData = bytes.subarray(dataStart, dataStart + compSize);
        entries[name] =
          method === 0 ? decoder.decode(compData) : await inflateRawBytes(compData);
      }

      cdOffset += 46 + nameLen + extraLen + commentLen;
    }
  } else {
    let offset = 0;
    while (offset + 30 <= bytes.length) {
      if (view.getUint32(offset, true) !== 0x04034b50) break;
      const method = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);
      const name = decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLen));
      const dataStart = offset + 30 + nameLen + extraLen;
      const compData = bytes.subarray(dataStart, dataStart + compSize);
      if (name.endsWith(".xml") || name.endsWith(".rels")) {
        entries[name] =
          method === 0 ? decoder.decode(compData) : await inflateRawBytes(compData);
      }
      offset = dataStart + compSize;
    }
  }

  return entries;
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const strings = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let siMatch;

  while ((siMatch = siRegex.exec(xml)) !== null) {
    const siContent = siMatch[1].replace(/<rPh\b[^>]*>[\s\S]*?<\/rPh>/g, "");
    const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g;
    let tMatch;
    let combined = "";
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      combined += decodeXmlEntities(tMatch[1]);
    }
    strings.push(combined);
  }
  return strings;
}

export function excelSerialToDateString(serial) {
  const utcDays = Math.round(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  const dateObj = new Date(utcMs);
  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function colLettersToIndex(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1;
}

export function parseAndValidateDate(rawDate) {
  const trimmed = String(rawDate || "").trim();
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

  const normalizedDate = `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;

  return { valid: true, normalizedDate };
}

export async function parseAndValidateBulkExpenseFile(file, activeCategories = []) {
  const arrayBuffer = await file.arrayBuffer();
  const entries = await extractZipEntriesFromBuffer(arrayBuffer);

  const sheetKey =
    entries["xl/worksheets/sheet1.xml"]
      ? "xl/worksheets/sheet1.xml"
      : Object.keys(entries)
          .filter((k) => k.startsWith("xl/worksheets/sheet") && k.endsWith(".xml"))
          .sort()[0];

  const sheetXml = sheetKey ? entries[sheetKey] : null;
  if (!sheetXml) {
    throw new Error("No worksheet found in the uploaded Excel file.");
  }

  const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);

  const rowsMap = new Map();
  const rowRegex = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch;
  let autoRowCounter = 0;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowAttrs = rowMatch[1];
    const rowBody = rowMatch[2];
    const rAttrMatch = /\br="(\d+)"/.exec(rowAttrs);
    const rowNum = rAttrMatch ? parseInt(rAttrMatch[1], 10) : ++autoRowCounter;
    autoRowCounter = rowNum;

    const cells = ["", "", "", "", "", ""];
    const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch;
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
        let tMatch;
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

  let headerRowNum = -1;
  const sortedRowNums = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  for (const rNum of sortedRowNums) {
    if (rNum > 10) break;
    const cols = rowsMap.get(rNum);
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
      "Invalid template format. Expected columns: Sr. No., Expense Name, Expense Amount, Expense Category, Expense Type, Expense Date. Please use the official BULK EXPENSE CREATION TEMPLATE.xlsx."
    );
  }

  // Build active category lookup (always include "Others" as default)
  const validCategoryMap = new Map();
  const validCategoryNames = [];
  activeCategories.forEach((c) => {
    if (c && c.name && c.active_flag !== false && !c.delete_flag) {
      validCategoryMap.set(c.name.trim().toLowerCase(), c.name.trim());
      validCategoryNames.push(c.name.trim());
    }
  });
  if (!validCategoryMap.has("others")) {
    validCategoryMap.set("others", "Others");
    validCategoryNames.push("Others");
  }

  const parsedRows = [];
  const allErrors = [];

  for (const rNum of sortedRowNums) {
    if (rNum <= headerRowNum) continue;
    const cols = rowsMap.get(rNum);
    const [srNo, name, amount, category, type, expenseDate] = cols;

    const hasExpenseData = [name, amount, category, type, expenseDate].some((v) => v !== "");
    if (!hasExpenseData) continue;

    const displaySrNo = srNo || String(parsedRows.length + 1);
    const rowErrors = [];

    // 1. Validate Sr. No.
    if (srNo !== "" && !/^[1-9]\d*$/.test(srNo)) {
      const msg = `Row ${rNum}: Invalid Sr. No. "${srNo}". Must be a positive integer.`;
      rowErrors.push(msg);
      allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Sr. No.", message: msg });
    }

    // 2. Validate Expense Name (3 to 100 chars, valid pattern)
    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): Expense Name is required.`;
      rowErrors.push(msg);
      allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Expense Name", message: msg });
    } else if (trimmedName.length < 3 || trimmedName.length > 100) {
      const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): Invalid Expense Name "${trimmedName}". Must be between 3 and 100 characters.`;
      rowErrors.push(msg);
      allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Expense Name", message: msg });
    } else if (!/^[a-zA-Z0-9\s_\-\/]+$/.test(trimmedName)) {
      const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): Invalid Expense Name "${trimmedName}". Only letters, numbers, spaces, dash, underscore, and forward slash are allowed.`;
      rowErrors.push(msg);
      allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Expense Name", message: msg });
    }

    // 3. Validate Expense Amount (>= 1, valid decimal)
    const trimmedAmount = (amount || "").trim();
    const parsedAmount = Number(trimmedAmount);
    if (
      !trimmedAmount ||
      /[eE]/.test(trimmedAmount) ||
      isNaN(parsedAmount) ||
      !isFinite(parsedAmount) ||
      parsedAmount < 1 ||
      parsedAmount > 9999999999.99
    ) {
      const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): Invalid Expense Amount "${trimmedAmount}". Must be a valid number >= 1.`;
      rowErrors.push(msg);
      allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Expense Amount", message: msg });
    }

    // 4. Validate Expense Category (Default to "Others" if blank)
    const trimmedCategory = (category || "").trim();
    let resolvedCategoryName = "Others";
    let isDefaultCategory = false;
    if (!trimmedCategory) {
      resolvedCategoryName = validCategoryMap.get("others") || "Others";
      isDefaultCategory = true;
    } else {
      const matched = validCategoryMap.get(trimmedCategory.toLowerCase());
      if (!matched) {
        resolvedCategoryName = trimmedCategory;
        const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): Invalid Expense Category "${trimmedCategory}". Allowed categories: ${validCategoryNames.join(", ")}.`;
        rowErrors.push(msg);
        allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Expense Category", message: msg });
      } else {
        resolvedCategoryName = matched;
      }
    }

    // 5. Validate Expense Type ("Variable" or "Fixed")
    const trimmedType = (type || "").trim();
    let normalizedType = trimmedType;
    if (trimmedType.toLowerCase() === "fixed") {
      normalizedType = "Fixed";
    } else if (trimmedType.toLowerCase() === "variable") {
      normalizedType = "Variable";
    } else {
      const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): Invalid Expense Type "${trimmedType}". Must be Variable or Fixed.`;
      rowErrors.push(msg);
      allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Expense Type", message: msg });
    }

    // 6. Validate Expense Date (DD-MM-YYYY or YYYY-MM-DD)
    const trimmedDate = (expenseDate || "").trim();
    const dateCheck = parseAndValidateDate(trimmedDate);
    if (!dateCheck.valid) {
      const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): Invalid Expense Date "${trimmedDate}". Must be a valid date in DD-MM-YYYY or YYYY-MM-DD format.`;
      rowErrors.push(msg);
      allErrors.push({ excelRowNumber: rNum, srNo: displaySrNo, column: "Expense Date", message: msg });
    }

    // Also run Zod schema check
    const zodResult = bulkExpenseRowZodSchema.safeParse({
      srNo: srNo || undefined,
      name: trimmedName,
      amount: trimmedAmount,
      category: resolvedCategoryName,
      type: normalizedType,
      expenseDate: dateCheck.normalizedDate || trimmedDate,
    });
    if (!zodResult.success && rowErrors.length === 0) {
      zodResult.error.errors.forEach((zErr) => {
        const msg = `Row ${rNum} (Sr. No. ${displaySrNo}): ${zErr.message}`;
        rowErrors.push(msg);
        allErrors.push({
          excelRowNumber: rNum,
          srNo: displaySrNo,
          column: String(zErr.path[0] || "Row"),
          message: msg,
        });
      });
    }

    parsedRows.push({
      excelRowNumber: rNum,
      srNo: displaySrNo,
      name: trimmedName,
      amount: trimmedAmount,
      category: resolvedCategoryName,
      isDefaultCategory,
      type: normalizedType,
      expenseDate: trimmedDate,
      normalizedDate: dateCheck.normalizedDate || trimmedDate,
      rowErrors,
      isValid: rowErrors.length === 0,
    });
  }

  if (parsedRows.length === 0) {
    throw new Error(
      "The uploaded template contains no expense data rows. Please fill in at least one expense record."
    );
  }

  return {
    rows: parsedRows,
    errors: allErrors,
    isValid: allErrors.length === 0,
  };
}
