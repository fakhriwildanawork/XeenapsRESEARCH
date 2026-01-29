/**
 * XEENAPS CV ARCHITECT - PDF ENGINE
 */

function handleGenerateCV_PDF(config) {
  try {
    // 1. Pre-flight Check: Ambil Data Profil
    const profile = getProfileFromRegistry();
    if (!profile || !profile.fullName) {
      return { status: 'error', message: 'Profile incomplete. Please fill your name in the Profile module first.' };
    }

    // 2. Tentukan Target Storage (Sharding)
    const threshold = 100 * 1024 * 1024; // 100MB cukup untuk PDF
    const storageTarget = getViableStorageTarget(threshold);
    if (!storageTarget) {
      return { status: 'error', message: 'Storage capacity reached on all nodes. Please register a new storage node.' };
    }

    // 3. Ambil Semua Data Mentah
    const allEdu = getEducationFromRegistry();
    const allCareer = getCareerFromRegistry();
    const allPubsResult = getPublicationFromRegistry(1, 1000); 
    const allPubs = allPubsResult.items || [];
    const allActsResult = getActivitiesFromRegistry(1, 1000);
    const allActs = allActsResult.items || [];

    // 4. Filter Berdasarkan Pilihan User
    const filteredEdu = allEdu.filter(e => config.selectedEducationIds.includes(e.id));
    const filteredCareer = allCareer.filter(c => config.selectedCareerIds.includes(c.id));
    const filteredPubs = allPubs.filter(p => config.selectedPublicationIds.includes(p.id));
    const filteredActs = allActs.filter(a => config.selectedActivityIds.includes(a.id));

    // 5. SINKRONISASI KRONOLOGIS (Descending)
    const sortTimeline = (list, startKey, endKey) => {
      return list.sort((a, b) => {
        const getVal = (v) => (v === 'Present' || !v) ? '9999' : String(v);
        return getVal(b[endKey]).localeCompare(getVal(a[endKey])) || getVal(b[startKey]).localeCompare(getVal(a[startKey]));
      });
    };

    const sortedEdu = sortTimeline(filteredEdu, 'startYear', 'endYear');
    const sortedCareer = sortTimeline(filteredCareer, 'startDate', 'endDate');
    const sortedPubs = filteredPubs.sort((a,b) => String(b.year).localeCompare(String(a.year)));
    const sortedActs = filteredActs.sort((a,b) => String(b.startDate).localeCompare(String(a.startDate)));

    // 6. Injeksi Foto Profil (Mandatory Fallback)
    let photoBase64 = "";
    if (profile.photoFileId) {
      try {
        const bytes = DriveApp.getFileById(profile.photoFileId).getBlob().getBytes();
        photoBase64 = "data:image/jpeg;base64," + Utilities.base64Encode(bytes);
      } catch (e) { console.warn("Failed to fetch profile photo"); }
    }
    
    // Placeholder if still empty
    if (!photoBase64) {
      photoBase64 = "https://lh3.googleusercontent.com/d/1wYTtwTX8m7X273W5f-oAR__fZj9bZsAS";
    }

    // 7. Build HTML berdasarkan Template
    const htmlContent = buildCVHtml(config.template, profile, photoBase64, sortedEdu, sortedCareer, sortedPubs, sortedActs, config.aiSummary);

    // 8. Konversi ke PDF
    const blob = HtmlService.createHtmlOutput(htmlContent).getAs('application/pdf').setName(`${profile.fullName} - CV.pdf`);
    
    // 9. Simpan ke Storage Node (Local vs Remote)
    let fileId;
    if (storageTarget.isLocal) {
      const folder = DriveApp.getFolderById(storageTarget.folderId);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileId = file.getId();
    } else {
      const res = UrlFetchApp.fetch(storageTarget.url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ 
          action: 'saveFileDirect', 
          fileName: `${profile.fullName} - CV.pdf`, 
          mimeType: 'application/pdf', 
          fileData: Utilities.base64Encode(blob.getBytes()), 
          folderId: storageTarget.folderId 
        })
      });
      fileId = JSON.parse(res.getContentText()).fileId;
    }

    // 10. Catat Metadata ke Registry
    const cvDoc = {
      id: Utilities.getUuid(),
      title: config.title,
      template: config.template,
      fileId: fileId,
      storageNodeUrl: storageTarget.url,
      selectedEducationIds: config.selectedEducationIds,
      selectedCareerIds: config.selectedCareerIds,
      selectedPublicationIds: config.selectedPublicationIds,
      selectedActivityIds: config.selectedActivityIds,
      includePhoto: true,
      aiSummary: config.aiSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveCVToRegistry(cvDoc);

    return { status: 'success', data: cvDoc };
  } catch (e) {
    console.error("CV Architect PDF Engine Crash: " + e.toString());
    return { status: 'error', message: 'PDF Engine Generation Failed: ' + e.toString() };
  }
}

/**
 * REFINED HTML TEMPLATES
 */
function buildCVHtml(template, profile, photo, edu, career, pubs, acts, summary) {
  const navy = "#004A74";
  const gold = "#FED400";
  const gray = "#64748B";

  let styles = `
    body { font-family: 'Helvetica', sans-serif; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; }
    .container { padding: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${navy}; padding-bottom: 20px; margin-bottom: 20px; }
    .name { font-size: 26px; font-weight: 900; color: ${navy}; margin: 0; text-transform: uppercase; }
    .title { font-size: 14px; font-weight: bold; color: ${gray}; margin-top: 5px; }
    .contact { font-size: 10px; color: ${gray}; margin-top: 10px; }
    .photo { width: 100px; height: 120px; border-radius: 12px; border: 2px solid ${gold}; object-fit: cover; }
    .section-title { font-size: 12px; font-weight: 900; color: ${navy}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .item { margin-bottom: 12px; }
    .item-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; color: #111; }
    .item-meta { font-size: 11px; color: ${gray}; font-style: italic; margin-bottom: 2px; }
    .item-desc { font-size: 11px; color: #475569; text-align: justify; }
    .summary { font-size: 11px; font-style: italic; background: #f8fafc; padding: 12px; border-left: 4px solid ${gold}; margin-bottom: 20px; color: #334155; }
    .list-item { font-size: 11px; margin-bottom: 6px; padding-left: 12px; position: relative; }
    .list-item::before { content: "•"; position: absolute; left: 0; color: ${gold}; }
  `;

  // TEMPLATE SELECTOR
  if (template === "Template B") {
    // Executive Blue: Sidebar Style
    styles += `
      .page { display: flex; min-height: 1000px; }
      .sidebar { width: 30%; background: ${navy}; color: white; padding: 40px 25px; }
      .main { width: 70%; padding: 40px 35px; }
      .side-photo { width: 100%; aspect-ratio: 1; border-radius: 20px; border: 3px solid rgba(255,255,255,0.1); margin-bottom: 25px; }
      .side-title { font-size: 10px; font-weight: 900; color: ${gold}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; }
      .side-text { font-size: 10px; color: rgba(255,255,255,0.8); margin-bottom: 10px; }
    `;
    return `<html><head><style>${styles}</style></head><body><div class="page">
      <div class="sidebar">
        <img src="${photo}" class="side-photo" />
        <h3 class="side-title">Contact</h3>
        <div class="side-text">${profile.email}</div>
        <div class="side-text">${profile.phone}</div>
        <div class="side-text">${profile.address}</div>
        <h3 class="side-title">Academic IDs</h3>
        <div class="side-text">SINTA: ${profile.sintaId || '-'}</div>
        <div class="side-text">SCOPUS: ${profile.scopusId || '-'}</div>
      </div>
      <div class="main">
        <h1 class="name">${profile.fullName}</h1>
        <p class="title">${profile.jobTitle} • ${profile.affiliation}</p>
        ${summary ? `<div class="summary">${summary}</div>` : ''}
        <h2 class="section-title">Professional Experience</h2>
        ${career.map(c => `<div class="item"><div class="item-header"><span>${c.position}</span><span>${c.startDate} - ${c.endDate}</span></div><div class="item-meta">${c.company}</div><div class="item-desc">${c.description}</div></div>`).join('')}
        <h2 class="section-title">Education</h2>
        ${edu.map(e => `<div class="item"><div class="item-header"><span>${e.institution}</span><span>${e.endYear}</span></div><div class="item-meta">${e.level} in ${e.major}</div></div>`).join('')}
        <h2 class="section-title">Recent Publications</h2>
        ${pubs.slice(0, 5).map(p => `<div class="list-item"><b>${p.title}</b> (${p.year}). ${p.publisherName}</div>`).join('')}
      </div>
    </div></body></html>`;
  }

  // DEFAULT (Template A: Modern Academic)
  return `<html><head><style>${styles}</style></head><body><div class="container">
    <div class="header">
      <div style="flex:1">
        <h1 class="name">${profile.fullName}</h1>
        <p class="title">${profile.jobTitle} • ${profile.affiliation}</p>
        <div class="contact">
          Email: ${profile.email} | Phone: ${profile.phone}<br/>
          Address: ${profile.address}
        </div>
      </div>
      <img src="${photo}" class="photo" />
    </div>
    ${summary ? `<div class="summary">${summary}</div>` : ''}
    <h2 class="section-title">Education Background</h2>
    ${edu.map(e => `<div class="item"><div class="item-header"><span>${e.institution}</span><span>${e.startYear} - ${e.endYear}</span></div><div class="item-meta">${e.level} in ${e.major}</div><div class="item-desc">${e.degree}</div></div>`).join('')}
    <h2 class="section-title">Professional Experience</h2>
    ${career.map(c => `<div class="item"><div class="item-header"><span>${c.position}</span><span>${c.startDate} - ${c.endDate}</span></div><div class="item-meta">${c.company} • ${c.location}</div><div class="item-desc">${c.description}</div></div>`).join('')}
    <h2 class="section-title">Publications & Impact</h2>
    ${pubs.map(p => `<div class="list-item"><b>${p.title}</b> (${p.year}). ${p.publisherName}. DOI: ${p.doi || '-'}</div>`).join('')}
    <h2 class="section-title">Activities & Certifications</h2>
    ${acts.map(a => `<div class="list-item"><b>${a.eventName}</b> (${a.startDate}). Organized by ${a.organizer}. Role: ${a.role}.</div>`).join('')}
  </div></body></html>`;
}