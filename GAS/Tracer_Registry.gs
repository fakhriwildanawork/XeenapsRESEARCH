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
    } else {
      // Sync headers for existing sheet (Prevents column shift errors)
      const currentHeaders = pSheet.getRange(1, 1, 1, pSheet.getLastColumn()).getValues()[0];
      const targetHeaders = CONFIG.SCHEMAS.TRACER_PROJECTS;
      const missingHeaders = targetHeaders.filter(h => !currentHeaders.includes(h));
      if (missingHeaders.length > 0) {
        const startCol = currentHeaders.length + 1;
        pSheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
        pSheet.getRange(1, startCol, 1, missingHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");
      }
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
    } else {
      // Update headers for references to include sharding
      const currentHeaders = rSheet.getRange(1, 1, 1, rSheet.getLastColumn()).getValues()[0];
      const targetHeaders = CONFIG.SCHEMAS.TRACER_REFERENCES;
      const missingHeaders = targetHeaders.filter(h => !currentHeaders.includes(h));
      if (missingHeaders.length > 0) {
        const startCol = currentHeaders.length + 1;
        rSheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
        rSheet.getRange(1, startCol, 1, missingHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");
      }
    }

    // 4. To Do Sheet
    let tSheet = ss.getSheetByName("TracerTodos");
    if (!tSheet) {
      tSheet = ss.insertSheet("TracerTodos");
      const headers = CONFIG.SCHEMAS.TRACER_TODOS;
      tSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      tSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      tSheet.setFrozenRows(1);
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
    
    // Using getValues for data type integrity
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rawItems = data.slice(1);
    
    let filtered = rawItems;
    if (search) {
      const s = search.toLowerCase();
      filtered = rawItems.filter(r => r.some(cell => String(cell).toLowerCase().includes(s)));
    }
    
    // Initial ID index for sorting fallback
    const updatedAtIdx = headers.indexOf('updatedAt');
    filtered.sort((a, b) => {
      const timeA = a[updatedAtIdx] ? new Date(a[updatedAtIdx]).getTime() : 0;
      const timeB = b[updatedAtIdx] ? new Date(b[updatedAtIdx]).getTime() : 0;
      return timeB - timeA;
    });
    
    const totalCount = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, (page * limit));
    
    const items = paginated.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        
        // Handle JSON array fields
        if (h === 'authors' || h === 'keywords') {
          try { 
            val = (typeof val === 'string' && val !== '') ? JSON.parse(val) : (Array.isArray(val) ? val : []); 
          } catch(e) { val = []; }
        }
        
        // Handle Date objects from Spreadsheet
        if (val instanceof Date) {
          val = val.toISOString();
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
    
    // Dynamic Mapping: Get headers from sheet to handle any column shifts
    const actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIdx = actualHeaders.indexOf('id');
    
    if (idIdx === -1) {
      setupTracerDatabase(); // Force repair
      return { status: 'error', message: 'ID column missing. Repair initiated.' };
    }

    const rowData = actualHeaders.map(h => {
      const val = item[h];
      if (val === undefined || val === null) return '';
      return (Array.isArray(val) || (typeof val === 'object')) ? JSON.stringify(val) : val;
    });

    const data = sheet.getDataRange().getValues();
    let existingRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === item.id) { existingRow = i + 1; break; }
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
    const tSheet = ss.getSheetByName("TracerTodos");
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const idIdx = data[0].indexOf('id');
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === id) { sheet.deleteRow(i + 1); break; }
      }
    }
    
    // Cleanup related logs, references, and todos
    if (lSheet) {
      const lData = lSheet.getDataRange().getValues();
      const pIdIdx = lData[0].indexOf('projectId');
      for (let j = lData.length - 1; j >= 1; j--) {
        if (lData[j][pIdIdx] === id) lSheet.deleteRow(j + 1);
      }
    }
    if (rSheet) {
      const rData = rSheet.getDataRange().getValues();
      const pIdIdx = rData[0].indexOf('projectId');
      for (let k = rData.length - 1; k >= 1; k--) {
        if (rData[k][pIdIdx] === id) rSheet.deleteRow(k + 1);
      }
    }
    if (tSheet) {
      const tData = tSheet.getDataRange().getValues();
      const pIdIdx = tData[0].indexOf('projectId');
      for (let m = tData.length - 1; m >= 1; m--) {
        if (tData[m][pIdIdx] === id) tSheet.deleteRow(m + 1);
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
      if (data[i][idIdx] === item.id) {
        existingRow = i + 1;
        break;
      }
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
    return { status: error };
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

/**
 * LINK REFERENCE: Updated with Proactive Initialization of sharded JSON
 */
function linkTracerReferenceToRegistry(item) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    let sheet = ss.getSheetByName("TracerReferences");
    if (!sheet) { setupTracerDatabase(); sheet = ss.getSheetByName("TracerReferences"); }
    
    // 1. IDENTITY GEN
    if (!item.id) item.id = Utilities.getUuid();
    if (!item.createdAt) item.createdAt = new Date().toISOString();

    // 2. PROACTIVE SHARDING: Create empty JSON file { "quotes": [] }
    const storageTarget = getViableStorageTarget(CONFIG.STORAGE.CRITICAL_THRESHOLD);
    if (storageTarget) {
      const jsonFileName = `ref_content_${item.id}.json`;
      const initialContent = JSON.stringify({ quotes: [] });

      if (storageTarget.isLocal) {
        const folder = DriveApp.getFolderById(CONFIG.FOLDERS.MAIN_LIBRARY);
        const file = folder.createFile(Utilities.newBlob(initialContent, 'application/json', jsonFileName));
        item.contentJsonId = file.getId();
        item.storageNodeUrl = ScriptApp.getService().getUrl();
      } else {
        const res = UrlFetchApp.fetch(storageTarget.url, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ action: 'saveJsonFile', fileName: jsonFileName, content: initialContent })
        });
        const resJson = JSON.parse(res.getContentText());
        if (resJson.status === 'success') {
          item.contentJsonId = resJson.fileId;
          item.storageNodeUrl = storageTarget.url;
        }
      }
    }

    // 3. REGISTRY SYNC
    const headers = CONFIG.SCHEMAS.TRACER_REFERENCES;
    const rowData = headers.map(h => item[h] || '');
    sheet.appendRow(rowData);

    return { status: 'success', data: item };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function unlinkTracerReferenceFromRegistry(id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerReferences");
    if (!sheet) return { status: 'error' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id');
    const jsonIdIdx = headers.indexOf('contentJsonId');
    const nodeIdx = headers.indexOf('storageNodeUrl');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id) {
        const fileId = data[i][jsonIdIdx];
        const nodeUrl = data[i][nodeIdx];
        
        // Cleanup sharded quotes file
        if (fileId && nodeUrl) {
          const myUrl = ScriptApp.getService().getUrl();
          if (nodeUrl === myUrl || nodeUrl === "") {
             permanentlyDeleteFile(fileId);
          } else {
            UrlFetchApp.fetch(nodeUrl, {
              method: 'post',
              contentType: 'application/json',
              payload: JSON.stringify({ action: 'deleteRemoteFiles', fileIds: [fileId] }),
              muteHttpExceptions: true
            });
          }
        }

        sheet.deleteRow(i + 1);
        return { status: 'success' };
      }
    }
    return { status: 'error' };
  } catch (e) { return { status: 'error' }; }
}

/**
 * SHARDING: Save/Update Reference Content (Saved Quotes)
 * Includes Row Discovery Failover and Guard Logic
 */
function saveReferenceContentToRegistry(item, content) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    let sheet = ss.getSheetByName("TracerReferences");
    if (!sheet) return { status: 'error', message: 'Sheet missing.' };
    
    const actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIdx = actualHeaders.indexOf('id');
    const pIdIdx = actualHeaders.indexOf('projectId');
    const cIdIdx = actualHeaders.indexOf('collectionId');
    const jsonIdIdx = actualHeaders.indexOf('contentJsonId');
    const nodeIdx = actualHeaders.indexOf('storageNodeUrl');
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    // PRIMARY LOOKUP: BY ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === item.id) { rowIndex = i + 1; break; }
    }
    
    // FAILOVER DISCOVERY: BY PROJECT + COLLECTION (Handles race conditions)
    if (rowIndex === -1 && item.projectId && item.collectionId) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][pIdIdx] === item.projectId && data[i][cIdIdx] === item.collectionId) {
          rowIndex = i + 1;
          break;
        }
      }
    }
    
    if (rowIndex === -1) throw new Error("Reference anchor not found. Please refresh list.");

    // Determine storage node
    let storageTarget;
    if (item.contentJsonId && item.contentJsonId.trim() !== "") {
      storageTarget = { url: item.storageNodeUrl, isLocal: !item.storageNodeUrl || item.storageNodeUrl === ScriptApp.getService().getUrl() };
    } else {
      storageTarget = getViableStorageTarget(CONFIG.STORAGE.CRITICAL_THRESHOLD);
    }
    if (!storageTarget) throw new Error("Storage Critical.");

    const jsonFileName = `ref_content_${item.id}.json`;
    const jsonBody = JSON.stringify(content);

    if (storageTarget.isLocal) {
      let file;
      // CORE GUARD: Verify ID before fetching from Drive
      if (item.contentJsonId && item.contentJsonId.trim() !== "") {
        file = DriveApp.getFileById(item.contentJsonId);
        file.setContent(jsonBody);
      } else {
        const folder = DriveApp.getFolderById(CONFIG.FOLDERS.MAIN_LIBRARY);
        file = folder.createFile(Utilities.newBlob(jsonBody, 'application/json', jsonFileName));
        item.contentJsonId = file.getId();
        if (jsonIdIdx > -1) sheet.getRange(rowIndex, jsonIdIdx + 1).setValue(item.contentJsonId);
      }
      item.storageNodeUrl = ScriptApp.getService().getUrl();
      if (nodeIdx > -1) sheet.getRange(rowIndex, nodeIdx + 1).setValue(item.storageNodeUrl);
    } else {
      const res = UrlFetchApp.fetch(storageTarget.url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ 
          action: 'saveJsonFile', 
          fileId: (item.contentJsonId && item.contentJsonId.trim() !== "") ? item.contentJsonId : null, 
          fileName: jsonFileName, 
          content: jsonBody 
        })
      });
      const resJson = JSON.parse(res.getContentText());
      if (resJson.status === 'success') {
        item.contentJsonId = resJson.fileId;
        item.storageNodeUrl = storageTarget.url;
        if (jsonIdIdx > -1) sheet.getRange(rowIndex, jsonIdIdx + 1).setValue(item.contentJsonId);
        if (nodeIdx > -1) sheet.getRange(rowIndex, nodeIdx + 1).setValue(item.storageNodeUrl);
      }
    }

    return { status: 'success', contentJsonId: item.contentJsonId, storageNodeUrl: item.storageNodeUrl };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

// --- TODO HANDLERS ---

function getTracerTodosFromRegistry(projectId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerTodos");
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getDisplayValues();
    const headers = data[0];
    const projectIdIdx = headers.indexOf('projectId');
    const isDoneIdx = headers.indexOf('isDone');
    
    return data.slice(1)
      .filter(r => r[projectIdIdx] === projectId)
      .map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          let val = row[i];
          if (h === 'isDone') val = (val === 'true' || val === true);
          obj[h] = val;
        });
        return obj;
      }).sort((a,b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  } catch (e) { return []; }
}

function saveTracerTodoToRegistry(item) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    let sheet = ss.getSheetByName("TracerTodos");
    if (!sheet) { setupTracerDatabase(); sheet = ss.getSheetByName("TracerTodos"); }
    
    const headers = CONFIG.SCHEMAS.TRACER_TODOS;
    const rowData = headers.map(h => {
      const val = item[h];
      return (val !== undefined && val !== null) ? val : '';
    });

    const data = sheet.getDataRange().getValues();
    const idIdx = headers.indexOf('id');
    let existingRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === item.id) {
        existingRow = i + 1;
        break;
      }
    }

    if (existingRow > -1) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    return { status: 'success' };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function deleteTracerTodoFromRegistry(id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.TRACER);
    const sheet = ss.getSheetByName("TracerTodos");
    if (!sheet) return { status: 'error' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { sheet.deleteRow(i + 1); break; }
    }
    return { status: 'success' };
  } catch (e) { return { status: 'error' }; }
}