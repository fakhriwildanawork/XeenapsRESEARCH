
/**
 * XEENAPS PKM - TRANSLATION SERVICE (LINGVA ENGINE)
 * Menggunakan Lingva API dengan sistem Marker [[XTn]] untuk preservasi tag HTML.
 * Ditambahkan sistem Chunking untuk menangani teks panjang agar tidak error URI Too Long.
 */

function fetchTranslation(text, targetLang) {
  if (!text) return "";

  // 1. EKSTRAKSI TAG & PENGGANTIAN DENGAN MARKER
  const preservedTags = [];
  const processedText = text.replace(/<[^>]+>/g, function(match) {
    const placeholder = "[[XT" + preservedTags.length + "]]";
    preservedTags.push(match);
    return placeholder;
  });

  // 2. CHUNKING LOGIC: Pecah teks menjadi bagian kecil (~1500 karakter)
  // Ini mencegah error "URI Too Long" pada request GET Lingva.
  const MAX_CHUNK_LENGTH = 1500;
  const chunks = [];
  let currentChunk = "";
  
  // Pecah berdasarkan kalimat atau spasi agar tidak merusak marker
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

  // 3. DAFTAR INSTANCE LINGVA
  const instances = [
    "https://lingva.ml/api/v1/auto/",
    "https://lingva.garudalinux.org/api/v1/auto/",
    "https://lingva.lunar.icu/api/v1/auto/"
  ];

  let translatedFull = "";

  // 4. PROSES TRANSLASI PER CHUNK
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
        lastError = "Code: " + response.getResponseCode();
      } catch (e) {
        lastError = e.toString();
      }
    }

    if (!isSuccess) {
      throw new Error("Translation chunk failed: " + lastError);
    }
    translatedFull += chunkTranslated + " ";
  }

  // 5. RESTORASI TAG (Penyusunan Kembali)
  let finalResult = translatedFull.trim();
  
  // Bersihkan spasi liar di sekitar marker
  finalResult = finalResult.replace(/\[\[\s*XT(\d+)\s*\]\]/g, "[[XT$1]]");

  preservedTags.forEach((tag, index) => {
    const marker = "[[XT" + index + "]]";
    finalResult = finalResult.split(marker).join(tag);
  });

  return finalResult;
}
