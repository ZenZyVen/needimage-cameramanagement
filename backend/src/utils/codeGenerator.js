const DELETED_SUFFIX_REGEX = /__DEL_\d+(?:_[a-z0-9]+)?$/i;

/**
 * Removes any archival suffix added when an item was soft-deleted.
 */
function stripDeletedSuffix(value) {
  return String(value || '').trim().replace(DELETED_SUFFIX_REGEX, '');
}

/**
 * Generates a unique archived tag/serial so the original slot can be reused safely.
 */
function makeArchivedCode(value, suffix) {
  const base = stripDeletedSuffix(value);
  const stamp = suffix || `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return `${base}__DEL_${stamp}`;
}

/**
 * Finds the smallest positive integer (1, 2, 3, ...) not present in usedNumbers.
 */
function findLowestAvailableInt(usedNumbers) {
  let n = 1;
  while (usedNumbers.has(n)) {
    n += 1;
  }
  return n;
}

/**
 * Returns the lowest available NE{XX} asset tag and SN-NE{XX} serial number
 * across active (non-deleted) equipment records, filling any deleted gaps.
 */
async function generateNextEquipmentCodes(db) {
  const existing = await db.equipment.findMany({
    select: { assetTag: true, serialNumber: true, isDeleted: true }
  });

  const activeTagSet = new Set();
  const activeSerialSet = new Set();
  const usedNumbers = new Set();

  for (const item of existing) {
    if (item.isDeleted) continue;
    const tag = (item.assetTag || '').trim().toUpperCase();
    const serial = (item.serialNumber || '').trim().toUpperCase();
    if (tag) activeTagSet.add(tag);
    if (serial) activeSerialSet.add(serial);

    const tagMatch = /^NE(\d+)$/i.exec(tag);
    if (tagMatch) {
      const parsed = parseInt(tagMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) usedNumbers.add(parsed);
    }
    const snMatch = /^SN-NE(\d+)$/i.exec(serial);
    if (snMatch) {
      const parsed = parseInt(snMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) usedNumbers.add(parsed);
    }
  }

  let nextNum = findLowestAvailableInt(usedNumbers);
  let assetTag = '';
  let serialNumber = '';

  while (true) {
    const suffix = String(nextNum).padStart(2, '0');
    assetTag = `NE${suffix}`;
    serialNumber = `SN-NE${suffix}`;
    if (!activeTagSet.has(assetTag) && !activeSerialSet.has(serialNumber)) {
      break;
    }
    nextNum += 1;
  }

  return { assetTag, serialNumber };
}

/**
 * Returns the lowest available PRJ-{XX} code and {XX} project number, filling any deleted gaps.
 */
async function generateNextProjectSequence(db) {
  const allProjects = await db.project.findMany({
    select: { projectCode: true, projectNumber: true }
  });

  const existingCodes = new Set();
  const usedNumbers = new Set();

  for (const p of allProjects) {
    if (p.projectCode) {
      const code = p.projectCode.trim().toUpperCase();
      existingCodes.add(code);
      const prjMatch = /^PRJ-(\d+)$/i.exec(code);
      if (prjMatch) {
        const parsed = parseInt(prjMatch[1], 10);
        if (!isNaN(parsed) && parsed > 0) usedNumbers.add(parsed);
      }
    }
    if (p.projectNumber) {
      const numStr = String(p.projectNumber).trim().toUpperCase();
      existingCodes.add(numStr);
      const numMatch = /^(\d+)$/.exec(numStr);
      if (numMatch) {
        const parsed = parseInt(numMatch[1], 10);
        if (!isNaN(parsed) && parsed > 0) usedNumbers.add(parsed);
      }
    }
  }

  let nextSeq = findLowestAvailableInt(usedNumbers);
  let candidateNumber = '';
  let candidateCode = '';

  while (true) {
    candidateNumber = String(nextSeq).padStart(2, '0');
    candidateCode = `PRJ-${candidateNumber}`;
    if (
      !usedNumbers.has(nextSeq) &&
      !existingCodes.has(candidateCode.toUpperCase()) &&
      !existingCodes.has(candidateNumber.toUpperCase())
    ) {
      break;
    }
    nextSeq += 1;
  }

  return {
    projectNumber: candidateNumber,
    projectCode: candidateCode
  };
}

/**
 * Helper for YYYY-XXX sequential codes (REQ, MNT, INV) that auto-fills deleted gaps.
 */
async function generateYearlySequentialCode({ records, field, prefix, year, reservedSet = null }) {
  const usedNumbers = new Set();
  const existingCodes = new Set();
  const regex = new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i');

  for (const record of records) {
    const raw = record?.[field];
    if (!raw) continue;
    const code = String(raw).trim().toUpperCase();
    existingCodes.add(code);
    const match = regex.exec(code);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) usedNumbers.add(parsed);
    }
  }

  if (reservedSet) {
    for (const item of reservedSet) {
      if (typeof item === 'number' && item > 0) {
        usedNumbers.add(item);
      } else if (typeof item === 'string') {
        const upper = item.trim().toUpperCase();
        existingCodes.add(upper);
        const match = regex.exec(upper);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > 0) usedNumbers.add(parsed);
        }
      }
    }
  }

  let n = findLowestAvailableInt(usedNumbers);
  let candidate = '';
  while (true) {
    candidate = `${prefix}-${year}-${String(n).padStart(3, '0')}`;
    if (!usedNumbers.has(n) && !existingCodes.has(candidate)) {
      break;
    }
    n += 1;
  }

  if (reservedSet) {
    reservedSet.add(candidate);
  }
  return candidate;
}

async function generateNextRequestNumber(db, year = new Date().getFullYear()) {
  const records = await db.borrowRequest.findMany({
    select: { requestNumber: true }
  });
  return generateYearlySequentialCode({
    records,
    field: 'requestNumber',
    prefix: 'REQ',
    year
  });
}

async function generateNextMaintenanceTicketNumber(db, year = new Date().getFullYear(), reservedSet = null) {
  const records = await db.maintenance.findMany({
    select: { ticketNumber: true }
  });
  return generateYearlySequentialCode({
    records,
    field: 'ticketNumber',
    prefix: 'MNT',
    year,
    reservedSet
  });
}

async function generateNextInvoiceNumber(db, year = new Date().getFullYear()) {
  const records = await db.invoice.findMany({
    select: { invoiceNumber: true }
  });
  return generateYearlySequentialCode({
    records,
    field: 'invoiceNumber',
    prefix: 'INV',
    year
  });
}

module.exports = {
  stripDeletedSuffix,
  makeArchivedCode,
  findLowestAvailableInt,
  generateNextEquipmentCodes,
  generateNextProjectSequence,
  generateNextRequestNumber,
  generateNextMaintenanceTicketNumber,
  generateNextInvoiceNumber
};
