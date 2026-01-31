/**
 * XEENAPS PKM - GROQ TRACER AI SERVICE
 * Specialized in contextual quote discovery and academic paraphrasing.
 */

function handleAiTracerQuoteExtraction(payload) {
  const { collectionId, contextQuery } = payload;
  const keys = getKeysFromSheet('Groq', 2);
  if (!keys || keys.length === 0) return { status: 'error', message: 'No Groq keys found.' };

  // 1. GET SOURCE CONTEXT
  let fullText = "";
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
      if (isLocal) {
        fullText = JSON.parse(DriveApp.getFileById(extractedId).getBlob().getDataAsString()).fullText;
      } else {
        const remoteRes = UrlFetchApp.fetch(nodeUrl + (nodeUrl.includes('?') ? '&' : '?') + "action=getFileContent&fileId=" + extractedId);
        fullText = JSON.parse(JSON.parse(remoteRes.getContentText()).content).fullText;
      }
    }
  } catch (e) {
    return { status: 'error', message: "Document context unavailable." };
  }

  if (!fullText) return { status: 'error', message: "Extracted content empty." };

  const prompt = `ACT AS A PRECISION RESEARCH ASSISTANT.
  I am looking for a specific quote/paragraph from a paper that matches this CONTEXT: "${contextQuery}".
  
  TASK: 
  1. SCAN the provided [DOCUMENT_CONTENT].
  2. EXTRACT the most relevant paragraph or sequence of sentences verbatim.
  3. IDENTIFY the surrounding context of that quote.
  
  --- RULES ---
  - RETURN RAW JSON ONLY.
  - DO NOT PARAPHRASE in the "originalText" field.
  - IF NOT FOUND, return an empty string for originalText.
  
  [DOCUMENT_CONTENT]:
  ${fullText.substring(0, 50000)}

  EXPECTED JSON:
  {
    "originalText": "The verbatim text from the paper...",
    "contextFound": "Brief explanation of where/how this matches your query..."
  }`;

  const config = getProviderModel('Groq');
  const model = config.model;

  for (let key of keys) {
    try {
      const res = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + key },
        payload: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "You are a scientific data finder. Provide only raw JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
        muteHttpExceptions: true
      });
      const responseData = JSON.parse(res.getContentText());
      if (responseData.choices && responseData.choices.length > 0) {
        return { status: 'success', data: JSON.parse(responseData.choices[0].message.content) };
      }
    } catch (err) { console.log("Groq Tracer rotate..."); }
  }
  return { status: 'error', message: 'Tracer AI Busy.' };
}

function handleAiTracerQuoteEnhancement(payload) {
  const { originalText, citation } = payload;
  const keys = getKeysFromSheet('Groq', 2);
  if (!keys || keys.length === 0) return { status: 'error', message: 'No Groq keys found.' };

  const prompt = `ACT AS AN ELITE ACADEMIC WRITER.
  TASK: Enhance and paraphrase the following verbatim quote into a smooth, scholarly sentence ready for a manuscript.
  
  ORIGINAL: "${originalText}"
  REQUIRED CITATION: ${citation}
  
  --- REQUIREMENTS ---
  - Provide a sophisticated, fluid paraphrase.
  - Integrate the citation naturally (Narrative or Parenthetical).
  - Use academic connectors (e.g., "Furthermore", "As underscored by...").
  - RETURN ONLY THE ENHANCED TEXT STRING. NO JSON. NO CONVERSATION.`;

  const config = getProviderModel('Groq');
  const model = config.model;

  for (let key of keys) {
    try {
      const res = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + key },
        payload: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        }),
        muteHttpExceptions: true
      });
      const responseData = JSON.parse(res.getContentText());
      if (responseData.choices && responseData.choices.length > 0) {
        return { status: 'success', data: responseData.choices[0].message.content.trim() };
      }
    } catch (err) { console.log("Groq Enhancer rotate..."); }
  }
  return { status: 'error', message: 'Enhancer AI Busy.' };
}