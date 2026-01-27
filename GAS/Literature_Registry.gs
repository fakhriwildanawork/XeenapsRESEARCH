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
 * Mengambil semua artikel tersimpan
 */
function getArchivedArticlesFromRegistry() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LITERATURE_ARCHIVE);
    const sheet = ss.getSheetByName("Archives");
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        // Handle boolean conversion for isFavorite
        if (h === 'isFavorite') {
          val = (val === true || val === 'true');
        }
        obj[h] = val;
      });
      return obj;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
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