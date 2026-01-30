
/**
 * XEENAPS PKM - DEEPSEEK AI SERVICE
 * Specialized for Reasoning and Contextual Deep Analysis.
 */

function callDeepSeekReasoner(prompt, collectionId) {
  const keys = getKeysFromSheet('DeepSeek', 2); // Column B in DeepSeek sheet
  if (!keys || keys.length === 0) return { status: 'error', message: 'No DeepSeek keys found in database.' };
  
  // 1. GET SOURCE CONTEXT FROM LIBRARY
  let context = "";
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LIBRARY);
    const sheet = ss.getSheetByName("Collections");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id');
    const extractedIdx = headers.indexOf('extractedJsonId');
    const nodeIdx = headers.indexOf('storageNodeUrl');
    
    let extractedId, nodeUrl;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === collectionId) {
        extractedId = data[i][extractedIdx];
        nodeUrl = data[i][nodeIdx];
        break;
      }
    }

    if (extractedId) {
      const myUrl = ScriptApp.getService().getUrl();
      const isLocal = !nodeUrl || nodeUrl === "" || nodeUrl === myUrl;
      let fullText = "";

      if (isLocal) {
        const file = DriveApp.getFileById(extractedId);
        fullText = JSON.parse(file.getBlob().getDataAsString()).fullText;
      } else {
        const remoteRes = UrlFetchApp.fetch(nodeUrl + (nodeUrl.indexOf('?') === -1 ? '?' : '&') + "action=getFileContent&fileId=" + extractedId);
        fullText = JSON.parse(JSON.parse(remoteRes.getContentText()).content).fullText;
      }
      context = fullText.substring(0, 100000); // 100k chars limit
    }
  } catch (e) {
    console.warn("Could not retrieve context for DeepSeek: " + e.toString());
  }

  // 2. CALL DEEPSEEK API
  for (let key of keys) {
    try {
      const url = "https://api.deepseek.com/v1/chat/completions";
      const payload = {
        model: "deepseek-reasoner", // The "Thinking" model
        messages: [
          { 
            role: "system", 
            content: "You are the Xeenaps Knowledge Consultant. Use the following [DOCUMENT_CONTEXT] as your primary intellectual source. If a user asks something outside the document, you MUST link it logically to the document's concepts or methodology. Be highly analytical and structural. Use <b> for key terms and <span class='xeenaps-highlight' style='background-color: #FED40030; color: #004A74; padding: 0 4px; border-radius: 4px;'> for critical insights. \n\n [DOCUMENT_CONTEXT]: \n" + context 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      };
      
      const res = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + key },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      const responseData = JSON.parse(res.getContentText());
      if (responseData.choices && responseData.choices.length > 0) {
        const choice = responseData.choices[0].message;
        // DeepSeek R1 returns reasoning_content for thinking trace
        return { 
          status: 'success', 
          data: choice.content,
          reasoning: choice.reasoning_content || "" 
        };
      }
    } catch (err) {
      console.log("DeepSeek rotation: key failed, trying next...");
    }
  }
  return { status: 'error', message: 'DeepSeek Consultation Service is currently overloaded.' };
}

/**
 * Main handler for Consultation Requests
 */
function handleAiConsultRequest(collectionId, question) {
  return callDeepSeekReasoner(question, collectionId);
}
