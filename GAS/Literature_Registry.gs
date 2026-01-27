/**
 * XEENAPS PKM - LITERATURE SEARCH REGISTRY
 * Handles persistent storage for global research articles discovery.
 */

/**
 * Setup database sheet untuk Archive Articles
 */
function setupLiteratureArchiveDatabase() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LITERATURE_ARCHIVE);
    let sheet = ss.getSheetByName("Archives");
    if (!sheet) {
      sheet = ss.insertSheet("Archives");
      const headers = CONFIG.SCHEMAS.ARCHIVED_ARTICLES;
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }
    return { status: 'success', message: 'Literature Archive Database ready.' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

/**
 * Mengambil artikel tersimpan dengan Pagination, Search, dan Sort
 */
function getArchivedArticlesFromRegistry(page = 1, limit = 25, search = "", sortKey = "createdAt", sortDir = "desc") {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LITERATURE_ARCHIVE);
    const sheet = ss.getSheetByName("Archives");
    if (!sheet) return { items: [], totalCount: 0 };
    
    const allValues = sheet.getDataRange().getValues();
    if (allValues.length <= 1) return { items: [], totalCount: 0 };
    
    const headers = allValues[0];
    const rawData = allValues.slice(1);
    
    // 1. FILTERING
    const searchLower = search.toLowerCase();
    let filtered = rawData.filter(row => {
      if (!searchLower) return true;
      // Search in Title, Label, Harvard Citation
      const titleIdx = headers.indexOf('title');
      const labelIdx = headers.indexOf('label');
      const citIdx = headers.indexOf('citationHarvard');
      return String(row[titleIdx] || "").toLowerCase().includes(searchLower) ||
             String(row[labelIdx] || "").toLowerCase().includes(searchLower) ||
             String(row[citIdx] || "").toLowerCase().includes(searchLower);
    });

    const totalCount = filtered.length;

    // 2. SORTING
    const sortIdx = headers.indexOf(sortKey);
    if (sortIdx !== -1) {
      filtered.sort((a, b) => {
        let valA = a[sortIdx];
        let valB = b[sortIdx];

        if (sortKey === 'createdAt') {
          const timeA = valA ? new Date(valA).getTime() : 0;
          const timeB = valB ? new Date(valB).getTime() : 0;
          return sortDir === 'asc' ? timeA - timeB : timeB - timeA;
        }

        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 3. PAGINATION
    const startIdx = (page - 1) * limit;
    const paginated = filtered.slice(startIdx, startIdx + limit);

    // 4. MAPPING
    const items = paginated.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (h === 'isFavorite') {
          val = (val === true || val === 'true');
        }
        obj[h] = val;
      });
      return obj;
    });

    return { items, totalCount };
  } catch (e) {
    return { items: [], totalCount: 0 };
  }
}

/**
 * Menyimpan artikel ke archive (Registry)
 */
function saveArchivedArticleToRegistry(item) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LITERATURE_ARCHIVE);
    let sheet = ss.getSheetByName("Archives");
    if (!sheet) {
      setupLiteratureArchiveDatabase();
      sheet = ss.getSheetByName("Archives");
    }
    
    const headers = CONFIG.SCHEMAS.ARCHIVED_ARTICLES;
    const rowData = headers.map(h => item[h] !== undefined ? item[h] : '');
    
    sheet.appendRow(rowData);
    return { status: 'success' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

/**
 * Menghapus artikel dari archive
 */
function deleteArchivedArticleFromRegistry(id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LITERATURE_ARCHIVE);
    const sheet = ss.getSheetByName("Archives");
    if (!sheet) return { status: 'error' };
    
    const data = sheet.getDataRange().getValues();
    const idIdx = data[0].indexOf('id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id) {
        sheet.deleteRow(i + 1);
        return { status: 'success' };
      }
    }
    return { status: 'error', message: 'Article ID not found' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

/**
 * Toggle status favorit untuk artikel archive
 */
function toggleFavoriteArticleInRegistry(id, status) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LITERATURE_ARCHIVE);
    const sheet = ss.getSheetByName("Archives");
    if (!sheet) return { status: 'error' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id');
    const favIdx = headers.indexOf('isFavorite');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id) {
        sheet.getRange(i + 1, favIdx + 1).setValue(status);
        return { status: 'success' };
      }
    }
    return { status: 'error', message: 'Article ID not found' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}