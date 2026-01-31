
/**
 * XEENAPS PKM - GROQ LITERATURE REVIEW SERVICE
 * Specialized in matrix extraction (35k char limit) and academic synthesis.
 */

function handleAiReviewRequest(subAction, payload) {
  if (subAction === 'extract') {
    return callGroqReviewExtractor(payload.collectionId, payload.centralQuestion);
  } else if (subAction === 'synthesize') {
    return callGroqNarrativeSynthesizer(payload.matrix, payload.centralQuestion);
  }
  return { status: 'error', message: 'Invalid subAction' };
}

/**
 * Matrix Extraction: Membedah 1 dokumen untuk menjawab pertanyaan utama.
 * Karakter dibatasi 35.000 sesuai instruksi.
 */
function callGroqReviewExtractor(collectionId, centralQuestion) {
  const keys = getKeysFromSheet('Groq', 2); 
  if (!keys || keys.length === 0) return { status: 'error', message: 'No Groq keys found.' };

  // 1. GET SOURCE CONTEXT FROM LIBRARY
  let context = "";
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.LIBRARY);
    const sheet = ss.getSheetByName("Collections");
    const data = sheet.getDataRange().getValues();
    const idIdx = data[0].indexOf('id');
    const extractedIdx = data[0].indexOf('extractedJsonId');
    const nodeIdx = data[0].indexOf('storageNodeUrl');
    
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
        const remoteRes = UrlFetchApp.fetch(nodeUrl + (nodeUrl.includes('?') ? '&' : '?') + "action=getFileContent&fileId=" + extractedId);
        fullText = JSON.parse(JSON.parse(remoteRes.getContentText()).content).fullText;
      }
      // MANDATORY LIMIT: 35.000 characters
      context = fullText.substring(0, 35000); 
    }
  } catch (e) {
    return { status: 'error', message: "Context retrieval failed: " + e.toString() };
  }

  const config = getProviderModel('Groq');
  const model = config.model;

  const prompt = `ACT AS A SENIOR SCIENTIFIC ANALYST.
  I am conducting a Literature Review on this central question: "${centralQuestion}".
  
  TASK: Extract data from the provided text to fill my review matrix.
  1. ANSWER: Directly answer the central question based ONLY on this text.
  2. VERBATIM: Provide one specific quote from the text as evidence for your answer.
  
  --- RULES ---
  - IF DATA NOT FOUND, return "Data not explicitly found in this source" for answer and empty string for verbatim.
  - RESPONSE MUST BE RAW JSON.
  - USE PLAIN STRING TEXT.
  
  TEXT TO ANALYZE:
  ${context}

  EXPECTED JSON:
  {
    "answer": "...",
    "verbatim": "..."
  }`;

  for (let key of keys) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const payload = {
        model: model,
        messages: [
          { role: "system", content: "You are an expert scientific data extractor. Always return raw JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
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
        return { status: 'success', data: JSON.parse(responseData.choices[0].message.content) };
      }
    } catch (err) {
      console.log("Groq Review rotation failed, trying next...");
    }
  }
  return { status: 'error', message: 'Extraction engine busy.' };
}

/**
 * Narrative Synthesis: Merajut seluruh baris matrix menjadi narasi akademik.
 */
function callGroqNarrativeSynthesizer(matrix, centralQuestion) {
  const keys = getKeysFromSheet('Groq', 2);
  if (!keys || keys.length === 0) return { status: 'error', message: 'No Groq keys found.' };

  const matrixSummary = matrix.map((m, i) => `SOURCE ${i+1} (${m.title}): ${m.answer}`).join('\n\n');

  const prompt = `ACT AS A DISTINGUISHED ACADEMIC PROFESSOR.
  TASK: Synthesize a Literature Review narrative for the central question: "${centralQuestion}".
  
  DATA INPUT (Matrix of findings from various literatures):
  ${matrixSummary}

  --- NARRATIVE REQUIREMENTS ---
  - Write a cohesive 4-paragraph academic narrative.
  - Para 1: Introduction of the problem and general trends across sources.
  - Para 2: Synthesis of similar viewpoints and confirmations.
  - Para 3: Discussion of contradictions or differences in methodologies/findings.
  - Para 4: Conclusion and synthesis of the current state of knowledge.
  - USE HTML TAGS: <b> for emphasis, <br/> for paragraph breaks.
  - RETURN PLAIN TEXT WITH HTML. NO MARKDOWN.
  
  LANGUAGE: ENGLISH.`;

  const config = getProviderModel('Groq');
  const model = config.model;

  for (let key of keys) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const payload = {
        model: model,
        messages: [
          { role: "system", content: "You are a professional academic writer. Provide only the synthesized narrative without conversation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5
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
        return { status: 'success', data: responseData.choices[0].message.content.trim() };
      }
    } catch (err) {
      console.log("Groq Synthesizer rotation failed, trying next...");
    }
  }
  return { status: 'error', message: 'Synthesis engine busy.' };
}
