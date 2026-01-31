
/**
 * XEENAPS PKM - TRANSLATION SERVICE (LINGVA ENGINE) - INDUSTRIAL GRADE
 * Menggunakan Lingva API dengan sistem Marker Unik ___XTn___ untuk preservasi tag HTML.
 * Versi stabil dengan Marker Repair Regex dan Optimasi Chunking.
 */

function fetchTranslation(text, targetLang) {
  if (!text) return "";

  try {
    // 1. EKSTRAKSI TAG & PENGGANTIAN DENGAN MARKER UNIK (Ultra-Resilient)
    const preservedTags = [];
    const processedText = text.replace(/<[^>]+>/g, function(match) {
      const placeholder = "___XT" + preservedTags.length + "___";
      preservedTags.push(match);
      return placeholder;
    });

    // 2. CHUNKING LOGIC: Perkecil ke 1000 karakter agar 100% aman dari URI Too Long
    const MAX_CHUNK_LENGTH = 1000;
    const chunks = [];
    let currentChunk = "";
    
    // Pemecahan cerdas berbasis spasi
    const segments = processedText.split(/(\s+)/);
    for (let segment of segments) {
      if ((currentChunk + segment).length > MAX_CHUNK_LENGTH) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = segment;
      } else {
        currentChunk += segment;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    const instances = [
      "https://lingva.ml/api/v1/auto/",
      "https://lingva.garudalinux.org/api/v1/auto/",
      "https://lingva.lunar.icu/api/v1/auto/"
    ];

    let translatedFull = "";

    // 3. PROSES TRANSLASI PER CHUNK
    for (let chunkText of chunks) {
      let chunkTranslated = "";
      let isSuccess = false;
      let lastError = "";

      for (let baseUrl of instances) {
        try {
          const url = baseUrl + targetLang + "/" + encodeURIComponent(chunkText);
          const response = UrlFetchApp.fetch(url, { 
            method: "get",
            muteHttpExceptions: true,
            timeout: 20000
          });

          if (response.getResponseCode() === 200) {
            const json = JSON.parse(response.getContentText());
            if (json.translation) {
              chunkTranslated = json.translation;
              isSuccess = true;
              break;
            }
          }
          lastError = "Instance response: " + response.getResponseCode();
        } catch (e) {
          lastError = e.toString();
        }
      }

      if (!isSuccess) throw new Error("Chunk Fail: " + lastError);
      translatedFull += chunkTranslated + " ";
    }

    // 4. MARKER REPAIR & RESTORASI TAG
    let finalResult = translatedFull.trim();
    
    // REGEX: Bersihkan spasi liar yang sering disisipkan engine translasi
    // Contoh: "___ XT 0 ___" menjadi "___XT0___"
    finalResult = finalResult.replace(/___\s*XT\s*(\d+)\s*___/gi, "___XT$1___");

    // Kembalikan tag HTML asli
    preservedTags.forEach((tag, index) => {
      const marker = "___XT" + index + "___";
      finalResult = finalResult.split(marker).join(tag);
    });

    return finalResult;

  } catch (err) {
    console.error("Translation Engine Error: " + err.toString());
    // Fallback: kembalikan teks asli jika gagal total agar tidak blank
    return text;
  }
}
