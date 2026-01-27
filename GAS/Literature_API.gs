/**
 * XEENAPS PKM - GLOBAL LITERATURE SEARCH PROXY
 * Memproses pencarian ke Semantic Scholar (bypass CORS) dan terjemahan via Lingva.
 */

function handleGlobalArticleSearch(params) {
  const query = params.query || "";
  const yearStart = params.yearStart;
  const yearEnd = params.yearEnd;

  // 1. TERJEMAHAN OTOMATIS VIA LINGVA (Target: EN)
  // Memastikan pencarian maksimal di Semantic Scholar meskipun input bahasa lokal.
  let searchTerms = query;
  try {
    const translated = lingvaTranslateQuery(query);
    if (translated) {
      searchTerms = translated;
    }
  } catch (e) {
    console.log("Lingva Engine Error: " + e.toString());
  }

  // 2. PENYUSUNAN PARAMETER SEMANTIC SCHOLAR
  const fields = 'paperId,title,authors,year,doi,url,venue,citationCount,abstract';
  let limit = params.limit || 12;
  
  // Base URL
  let scholarUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchTerms)}&limit=${limit}&fields=${fields}`;
  
  // Append Year Range if provided
  if (yearStart && yearEnd) {
    scholarUrl += `&year=${yearStart}-${yearEnd}`;
  } else if (yearStart) {
    scholarUrl += `&year=${yearStart}-2026`;
  }

  // 3. FETCH SERVER-TO-SERVER (BYPASS CORS)
  try {
    const response = UrlFetchApp.fetch(scholarUrl, { 
      muteHttpExceptions: true,
      headers: { "Accept": "application/json" }
    });
    
    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      return { 
        status: 'error', 
        message: 'Semantic Scholar API Error (' + responseCode + '): ' + response.getContentText() 
      };
    }

    const result = JSON.parse(response.getContentText());
    return { 
      status: 'success', 
      data: result.data || [],
      translatedQuery: searchTerms !== query ? searchTerms : null
    };
  } catch (err) {
    return { status: 'error', message: 'Literature Search Proxy Error: ' + err.toString() };
  }
}

/**
 * Lingva Engine - Khusus untuk pencarian Query
 */
function lingvaTranslateQuery(text) {
  if (!text) return "";
  
  // Mencoba beberapa instance publik Lingva untuk stabilitas
  const instances = [
    "https://lingva.ml/api/v1/auto/en/",
    "https://lingva.garudalinux.org/api/v1/auto/en/",
    "https://lingva.lunar.icu/api/v1/auto/en/"
  ];

  for (let baseUrl of instances) {
    try {
      const url = baseUrl + encodeURIComponent(text);
      const res = UrlFetchApp.fetch(url, { 
        muteHttpExceptions: true, 
        timeoutInSeconds: 10 
      });
      
      if (res.getResponseCode() === 200) {
        const json = JSON.parse(res.getContentText());
        return json.translation || text;
      }
    } catch (e) {
      console.log("Instance failure: " + baseUrl);
    }
  }
  return text; // Fallback ke teks asli jika semua gagal
}