
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
  I am conducting a deep Literature Review on this central question: "${centralQuestion}".
  
  TASK: Perform a COMPREHENSIVE AND HOLISTIC extraction from the provided source text.
  1. ANSWER: Provide an EXTREMELY DETAILED SINGLE-PARAGRAPH analysis. This paragraph must be holistic, technical, and cover methodology, primary data, and nuances used by the author. Do not use bullets or multiple paragraphs for this section.
  2. VERBATIM: Extract the most impactful sentence that encapsulates their primary argument or result.
  
  --- RULES ---
  - IF DATA NOT FOUND, return "Data not explicitly found in this source" for answer and empty string for verbatim.
  - RESPONSE MUST BE RAW JSON.
  - USE PLAIN STRING TEXT.
  - NO CONVERSATION.
  
  TEXT TO ANALYZE:
  ${context}

  EXPECTED JSON:
  {
    "answer": "Holistic technical single-paragraph analysis covering methodology and results...",
    "verbatim": "..."
  }`;

  for (let key of keys) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const payload = {
        model: model,
        messages: [
          { role: "system", content: "You are an expert scientific data extractor. You provide holistic, technical, and highly informative academic answers in a single dense paragraph." },
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
  TASK: Synthesize a VERY COMPREHENSIVE Literature Review narrative for: "${centralQuestion}".
  
  DATA INPUT (Matrix of findings from various literatures):
  ${matrixSummary}

  --- NARRATIVE REQUIREMENTS ---
  - Write a cohesive and high-level academic synthesis.
  - Use a mix of analytical paragraphs and NUMBERED LISTS for key comparative findings or trends to improve readability.
  - Structure:
    1. Introduction of the problem space and general trends.
    2. Numbered list of core technical pillars found across sources.
    3. Discussion of contradictions or gaps between sources.
    4. Holistic conclusion on the current state of knowledge.
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
          { role: "system", content: "You are a professional academic writer. Provide a comprehensive synthesized narrative using HTML formatting and numbering lists for clarity." },
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
