/**
 * XEENAPS PKM - GROQ TRACER AI SERVICE
 * Specialized in contextual quote discovery and academic paraphrasing.
 * Updated to support triple-quote discovery for holistic coverage.
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

  // INCREASE CONTEXT WINDOW TO 100,000 CHARS FOR BETTER COVERAGE
  const contextSnippet = fullText.substring(0, 100000);

  const prompt = `ACT AS A PRECISION RESEARCH ASSISTANT.
  I am looking for exactly THREE (3) distinct and relevant quotes/paragraphs from a paper that match this CONTEXT: "${contextQuery}".
  
  TASK: 
  1. SCAN the provided [DOCUMENT_CONTENT].
  2. IDENTIFY 3 different impactful evidence blocks (paragraphs or groups of sentences).
  3. EXTRACT "originalText" verbatim for each.
  4. ARCHITECT an "enhancedText" for each: a sophisticated academic paraphrase that describes the finding purely. 
     - DO NOT include in-text citations or years in "enhancedText". 
     - Use high-level vocabulary suitable for a top-tier journal.
  
  --- RULES ---
  - RETURN RAW JSON ONLY.
  - RESPONSE_FORMAT: { "data": [ { "originalText": "...", "enhancedText": "..." }, ... ] }
  - IF less than 3 are found, return as many as possible (min 1).
  
  [DOCUMENT_CONTENT]:
  ${contextSnippet}`;

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
            { role: "system", content: "You are a scientific data specialist. Provide only raw JSON with 'data' array containing original and enhanced fields." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
        muteHttpExceptions: true
      });
      const responseData = JSON.parse(res.getContentText());
      if (responseData.choices && responseData.choices.length > 0) {
        const rawContent = responseData.choices[0].message.content;
        
        // RESILIENT JSON EXTRACTION (HANDLING CHATTER)
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // FALLBACK LOGIC FOR INCONSISTENT AI KEYS
          const dataArray = parsed.data || parsed.quotes || parsed.results || (Array.isArray(parsed) ? parsed : null);
          
          if (dataArray && Array.isArray(dataArray)) {
            return { status: 'success', data: dataArray };
          }
        }
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