/**
 * XEENAPS PKM - TRACER REGISTRY MODULE
 * Handles Audit Trail, Lab Notebooks, and Project References.
 */

function setupTracerDatabase() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    
    // 1. Projects Sheet
    let pSheet = ss.getSheetByName("TracerProjects");
    if (!pSheet) {
      pSheet = ss.insertSheet("TracerProjects");
      const headers = CONFIG.SCHEMAS.TRACER_PROJECTS;
      pSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      pSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      pSheet.setFrozenRows(1);
    }

    // 2. Logs Sheet (Activity Journal)
    let lSheet = ss.getSheetByName("TracerLogs");
    if (!lSheet) {
      lSheet = ss.insertSheet("TracerLogs");
      const headers = CONFIG.SCHEMAS.TRACER_LOGS;
      lSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      lSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      lSheet.setFrozenRows(1);
    }

    // 3. References Sheet (Relationship Table)
    let rSheet = ss.getSheetByName("TracerReferences");
    if (!rSheet) {
      rSheet = ss.insertSheet("TracerReferences");
      const headers = CONFIG.SCHEMAS.TRACER_REFERENCES;
      rSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      rSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      rSheet.setFrozenRows(1);
    }

    return { status: 'success', message: 'Tracer database structure synchronized.' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// --- PROJECT HANDLERS ---

function getTracerProjectsFromRegistry(page = 1, limit = 25, search = "") {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerProjects");
    if (!sheet) return { items: [], totalCount: 0 };
    
    const data = sheet.getDataRange().getDisplayValues();
    const headers = data[0];
    const rawItems = data.slice(1);
    
    let filtered = rawItems;
    if (search) {
      const s = search.toLowerCase();
      filtered = rawItems.filter(r => r.some(cell => String(cell).toLowerCase().includes(s)));
    }
    
    filtered.sort((a, b) => new Date(b[headers.indexOf('updatedAt')]).getTime() - new Date(a[headers.indexOf('updatedAt')]).getTime());
    
    const totalCount = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    
    const items = paginated.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (h === 'authors') {
          try { val = JSON.parse(val || '[]'); } catch(e) { val = [val]; }
        }
        obj[h] = val;
      });
      return obj;
    });
    
    return { items, totalCount };
  } catch (e) { return { items: [], totalCount: 0 }; }
}

function saveTracerProjectToRegistry(item) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    let sheet = ss.getSheetByName("TracerProjects");
    if (!sheet) { setupTracerDatabase(); sheet = ss.getSheetByName("TracerProjects"); }
    
    const headers = CONFIG.SCHEMAS.TRACER_PROJECTS;
    const rowData = headers.map(h => {
      const val = item[h];
      return (Array.isArray(val) || (typeof val === 'object' && val !== null)) ? JSON.stringify(val) : (val !== undefined ? val : '');
    });

    const data = sheet.getDataRange().getValues();
    let existingRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === item.id) { existingRow = i + 1; break; }
    }

    if (existingRow > -1) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    return { status: 'success' };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function deleteTracerProjectFromRegistry(id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerProjects");
    const lSheet = ss.getSheetByName("TracerLogs");
    const rSheet = ss.getSheetByName("TracerReferences");
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) { sheet.deleteRow(i + 1); break; }
      }
    }
    
    // Cleanup related logs and references
    if (lSheet) {
      const lData = lSheet.getDataRange().getValues();
      for (let j = lData.length - 1; j >= 1; j--) {
        if (lData[j][1] === id) lSheet.deleteRow(j + 1);
      }
    }
    if (rSheet) {
      const rData = rSheet.getDataRange().getValues();
      for (let k = rData.length - 1; k >= 1; k--) {
        if (rData[k][1] === id) rSheet.deleteRow(k + 1);
      }
    }
    return { status: 'success' };
  } catch (e) { return { status: 'error' }; }
}

// --- LOG HANDLERS ---

function getTracerLogsFromRegistry(projectId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerLogs");
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getDisplayValues();
    const headers = data[0];
    const projectIdIdx = headers.indexOf('projectId');
    
    return data.slice(1)
      .filter(r => r[projectIdIdx] === projectId)
      .map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) { return []; }
}

function saveTracerLogToRegistry(item, content) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    let sheet = ss.getSheetByName("TracerLogs");
    if (!sheet) { setupTracerDatabase(); sheet = ss.getSheetByName("TracerLogs"); }
    
    const headers = CONFIG.SCHEMAS.TRACER_LOGS;
    const data = sheet.getDataRange().getValues();
    const idIdx = headers.indexOf('id');
    let existingRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === item.id) { existingRow = i + 1; break; }
    }

    // Sharding payload (Log content is sharded like Notes)
    if (content) {
      let storageTarget;
      if (existingRow > -1) {
         storageTarget = { url: item.storageNodeUrl, isLocal: !item.storageNodeUrl || item.storageNodeUrl === ScriptApp.getService().getUrl() };
      } else {
         storageTarget = getViableStorageTarget(CONFIG.STORAGE.CRITICAL_THRESHOLD);
      }
      if (!storageTarget) throw new Error("Storage Critical.");

      const jsonFileName = `tracer_log_${item.id}.json`;
      const jsonBody = JSON.stringify(content);

      if (storageTarget.isLocal) {
        let file;
        if (item.logJsonId) {
          file = DriveApp.getFileById(item.logJsonId);
          file.setContent(jsonBody);
        } else {
          const folder = DriveApp.getFolderById(CONFIG.FOLDERS.MAIN_LIBRARY);
          file = folder.createFile(Utilities.newBlob(jsonBody, 'application/json', jsonFileName));
          item.logJsonId = file.getId();
        }
        item.storageNodeUrl = ScriptApp.getService().getUrl();
      } else {
        const res = UrlFetchApp.fetch(storageTarget.url, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ action: 'saveJsonFile', fileId: item.logJsonId || null, fileName: jsonFileName, content: jsonBody })
        });
        const resJson = JSON.parse(res.getContentText());
        if (resJson.status === 'success') {
          item.logJsonId = resJson.fileId;
          item.storageNodeUrl = storageTarget.url;
        }
      }
    }

    const rowData = headers.map(h => item[h] || '');
    if (existingRow > -1) sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    else sheet.appendRow(rowData);

    return { status: 'success', data: item };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function deleteTracerLogFromRegistry(id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerLogs");
    if (!sheet) return { status: 'error' };
    
    const data = sheet.getDataRange().getValues();
    const idIdx = data[0].indexOf('id');
    const jsonIdIdx = data[0].indexOf('logJsonId');
    const nodeIdx = data[0].indexOf('storageNodeUrl');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id) {
        const fileId = data[i][jsonIdIdx];
        const nodeUrl = data[i][nodeIdx];
        if (fileId && nodeUrl) {
          const myUrl = ScriptApp.getService().getUrl();
          if (nodeUrl === myUrl || nodeUrl === "") permanentlyDeleteFile(fileId);
          else UrlFetchApp.fetch(nodeUrl, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ action: 'deleteRemoteFiles', fileIds: [fileId] }) });
        }
        sheet.deleteRow(i + 1);
        return { status: 'success' };
      }
    }
    return { status: 'error' };
  } catch (e) { return { status: 'error' }; }
}

// --- REFERENCE HANDLERS ---

function getTracerReferencesFromRegistry(projectId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerReferences");
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getDisplayValues();
    const headers = data[0];
    const projectIdIdx = headers.indexOf('projectId');
    
    return data.slice(1)
      .filter(r => r[projectIdIdx] === projectId)
      .map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });
  } catch (e) { return []; }
}

function linkTracerReferenceToRegistry(item) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    let sheet = ss.getSheetByName("TracerReferences");
    if (!sheet) { setupTracerDatabase(); sheet = ss.getSheetByName("TracerReferences"); }
    
    const headers = CONFIG.SCHEMAS.TRACER_REFERENCES;
    const rowData = headers.map(h => item[h] || '');
    sheet.appendRow(rowData);
    return { status: 'success' };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function unlinkTracerReferenceFromRegistry(id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerReferences");
    if (!sheet) return { status: 'error' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { sheet.deleteRow(i + 1); break; }
    }
    return { status: 'success' };
  } catch (e) { return { status: 'error' }; }
}