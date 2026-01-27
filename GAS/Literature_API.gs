/**
 * XEENAPS PKM - GLOBAL LITERATURE SEARCH PROXY (OPENALEX EDITION)
 * Memproses pencarian ke OpenAlex (bypass CORS) dan terjemahan via Lingva.
 */

function handleGlobalArticleSearch(params) {
  const query = params.query || "";
  const yearStart = params.yearStart;
  const yearEnd = params.yearEnd;

  // 1. TERJEMAHAN OTOMATIS VIA LINGVA (Target: EN)
  let searchTerms = query;
  try {
    const translated = lingvaTranslateQuery(query);
    if (translated) {
      searchTerms = translated;
    }
  } catch (e) {
    console.log("Lingva Engine Error: " + e.toString());
  }

  // 2. PENYUSUNAN PARAMETER OPENALEX
  // OpenAlex lebih stabil (Rate limit lebih besar) dan tidak memerlukan API Key untuk pencarian publik.
  let limit = params.limit || 12;
  let openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(searchTerms)}&per_page=${limit}`;
  
  // Append Filter Tahun (publication_year)
  if (yearStart && yearEnd) {
    openAlexUrl += `&filter=publication_year:${yearStart}-${yearEnd}`;
  } else if (yearStart) {
    openAlexUrl += `&filter=publication_year:${yearStart}-2026`;
  }

  // 3. FETCH SERVER-TO-SERVER (BYPASS CORS)
  try {
    const response = UrlFetchApp.fetch(openAlexUrl, { 
      muteHttpExceptions: true,
      headers: { "Accept": "application/json" }
    });
    
    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      return { 
        status: 'error', 
        message: 'OpenAlex API Error (' + responseCode + '): ' + response.getContentText() 
      };
    }

    const result = JSON.parse(response.getContentText());
    
    // 4. MAPPING OPENALEX TO XEENAPS SCHEMA
    // Sesuai permintaan: Abstract dikosongkan untuk menghemat kredit & mempercepat loading.
    const mappedData = (result.results || []).map(item => ({
      paperId: item.id,
      title: item.display_name || "Untitled",
      authors: (item.authorships || []).map(a => ({ name: a.author.display_name })),
      year: item.publication_year || null,
      doi: item.doi ? item.doi.replace('https://doi.org/', '') : "",
      url: item.doi || item.ids?.openalex || "",
      venue: item.primary_location?.source?.display_name || "Academic Source",
      citationCount: item.cited_by_count || 0,
      abstract: "" // Dihilangkan sesuai permintaan (user cek via DOI)
    }));

    return { 
      status: 'success', 
      data: mappedData,
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
  return text; 
}