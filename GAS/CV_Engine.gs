/**
 * XEENAPS CV ARCHITECT - PDF ENGINE V4 (SINGLE PREMIUM TEMPLATE)
 */

function handleGenerateCV_PDF(config) {
  try {
    const profile = getProfileFromRegistry();
    if (!profile || !profile.fullName) {
      return { status: 'error', message: 'Profile incomplete. Please fill your name in the Profile module first.' };
    }

    const threshold = 100 * 1024 * 1024;
    const storageTarget = getViableStorageTarget(threshold);
    if (!storageTarget) {
      return { status: 'error', message: 'Storage capacity reached. Please register a new storage node.' };
    }

    const allEdu = getEducationFromRegistry();
    const allCareer = getCareerFromRegistry();
    const allPubsResult = getPublicationFromRegistry(1, 1000); 
    const allPubs = allPubsResult.items || [];
    const allActsResult = getActivitiesFromRegistry(1, 1000);
    const allActs = allActsResult.items || [];

    const filteredEdu = allEdu.filter(e => config.selectedEducationIds.includes(e.id));
    const filteredCareer = allCareer.filter(c => config.selectedCareerIds.includes(c.id));
    const filteredPubs = allPubs.filter(p => config.selectedPublicationIds.includes(p.id));
    const filteredActs = allActs.filter(a => config.selectedActivityIds.includes(a.id));

    const sortTimeline = (list, startKey, endKey) => {
      return list.sort((a, b) => {
        const getVal = (v) => (v === 'Present' || !v) ? '9999' : String(v);
        return getVal(b[endKey]).localeCompare(getVal(a[endKey])) || getVal(b[startKey]).localeCompare(getVal(a[startKey]));
      });
    };

    const sortedEdu = sortTimeline(filteredEdu, 'startYear', 'endYear');
    const sortedCareer = sortTimeline(filteredCareer, 'startDate', 'endDate');
    const sortedPubs = filteredPubs.sort((a,b) => String(b.year).localeCompare(String(a.year)));
    const sortedActs = filteredActs.sort((a,b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

    let photoBase64 = "";
    if (profile.photoFileId) {
      try {
        const bytes = DriveApp.getFileById(profile.photoFileId).getBlob().getBytes();
        photoBase64 = "data:image/jpeg;base64," + Utilities.base64Encode(bytes);
      } catch (e) { console.warn("Failed to fetch profile photo"); }
    }
    
    if (!photoBase64) {
      photoBase64 = "https://lh3.googleusercontent.com/d/1wYTtwTX8m7X273W5f-oAR__fZj9bZsAS";
    }

    const htmlContent = buildCVHtml(profile, photoBase64, sortedEdu, sortedCareer, sortedPubs, sortedActs, config.aiSummary);

    const blob = HtmlService.createHtmlOutput(htmlContent).getAs('application/pdf').setName(`${profile.fullName} - CV.pdf`);
    
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

    const cvDoc = {
      id: Utilities.getUuid(),
      title: config.title,
      template: "Standard Professional",
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
    console.error("CV Architect Engine Crash: " + e.toString());
    return { status: 'error', message: 'PDF Engine Failed: ' + e.toString() };
  }
}

function formatDateSafe(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr === 'Unknown' || dateStr === '-') return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      if (/^\d{4}$/.test(String(dateStr).trim())) return dateStr;
      return dateStr;
    }
    const day = d.getDate().toString().padStart(2, '0');
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

function buildCVHtml(profile, photo, edu, career, pubs, acts, summary) {
  const navy = "#004A74";
  const black = "#000000";
  const logoUrl = "https://lh3.googleusercontent.com/d/1ZpVAXWGLDP2C42Fct0bisloaQLf2095_";
  
  const displayBirth = formatDateSafe(profile.birthDate);

  let styles = `
    @page { margin: 0; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; color: ${black}; line-height: 1.5; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
    .container { padding: 60px 45px 45px 45px; }
    
    /* Header Grid */
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
    .photo-cell { width: 130px; vertical-align: top; }
    .photo-frame { width: 120px; height: 160px; object-fit: cover; border: 1.5pt solid ${navy}; border-radius: 4px; background: #f8fafc; }
    .profile-cell { vertical-align: top; padding-left: 30px; }
    .name { font-size: 24pt; font-weight: 900; color: ${navy}; margin: 0 0 12px 0; line-height: 1.1; }
    
    .info-table { border-collapse: collapse; }
    .info-table td { font-size: 10pt; padding: 2pt 0; vertical-align: top; }
    .info-label { font-weight: bold; color: ${black}; width: 90px; }
    .info-colon { font-weight: bold; color: ${black}; width: 15px; text-align: center; }
    .info-value { font-weight: bold; color: ${navy}; }

    /* Section Styles */
    .section { margin-bottom: 30px; }
    .section-title { font-size: 11pt; font-weight: 900; color: ${navy}; border-bottom: 2.5pt solid ${navy}; padding-bottom: 4px; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 1.5px; }
    
    .summary-box { font-size: 10.5pt; font-style: italic; border-left: 5pt solid ${navy}; padding: 15px 20px; margin-bottom: 30px; color: ${black}; background: #fdfdfd; border-top: 0.5pt solid ${navy}; border-bottom: 0.5pt solid ${navy}; border-right: 0.5pt solid ${navy}; text-align: justify; }

    /* Timeline Rail */
    .timeline-area { position: relative; padding-left: 22px; margin-left: 10px; border-left: 1.5pt solid ${navy}; }
    .timeline-dot { position: absolute; left: -26.5px; top: 5px; width: 9px; height: 9px; background: ${navy}; border-radius: 50%; border: 2pt solid white; }
    
    .entry { position: relative; margin-bottom: 20px; }
    .entry-header { display: table; width: 100%; }
    .entry-title { display: table-cell; font-size: 11pt; font-weight: 900; color: ${navy}; }
    .entry-year { display: table-cell; text-align: right; font-size: 10pt; font-weight: 900; color: ${black}; width: 120px; }
    .entry-meta { font-size: 9.5pt; font-weight: bold; color: ${black}; margin-top: 2px; }
    .entry-desc { font-size: 9pt; color: ${black}; margin-top: 6px; text-align: justify; line-height: 1.4; }

    .id-badge { display: inline-block; padding: 3px 10px; border: 1.2pt solid ${navy}; color: ${navy}; font-size: 8.5pt; font-weight: 900; border-radius: 4px; margin: 0 8px 8px 0; }
    
    .footer { position: fixed; bottom: 25px; left: 45px; right: 45px; border-top: 1.2pt solid ${black}; padding-top: 12px; text-align: center; font-size: 8pt; font-weight: 900; color: ${black}; text-transform: uppercase; letter-spacing: 2.5px; }
  `;

  // Render profile data rows
  const profileRows = [
    { label: 'Birth', value: displayBirth },
    { label: 'Job', value: profile.jobTitle },
    { label: 'Affiliation', value: profile.affiliation },
    { label: 'Email', value: profile.email },
    { label: 'Phone', value: profile.phone },
    { label: 'Address', value: profile.address },
    { label: 'Social', value: profile.socialMedia }
  ].filter(r => r.value && r.value !== '-');

  const renderSection = (title, data, renderer, useTimeline = false) => {
    if (!data || data.length === 0) return '';
    return `
      <div class="section">
        <div class="section-title">${title}</div>
        <div class="${useTimeline ? 'timeline-area' : ''}">
          ${data.map(renderer).join('')}
        </div>
      </div>
    `;
  };

  const eduRenderer = e => `
    <div class="entry">
      <div class="timeline-dot"></div>
      <div class="entry-header">
        <div class="entry-title">${e.institution}</div>
        <div class="entry-year">${e.startYear} - ${e.endYear}</div>
      </div>
      <div class="entry-meta">${e.level} in ${e.major} • ${e.degree}</div>
    </div>`;

  const careerRenderer = c => `
    <div class="entry">
      <div class="timeline-dot"></div>
      <div class="entry-header">
        <div class="entry-title">${c.position}</div>
        <div class="entry-year">${c.startDate} - ${c.endDate}</div>
      </div>
      <div class="entry-meta">${c.company} • ${c.location}</div>
      ${c.description ? `<div class="entry-desc">${c.description}</div>` : ''}
    </div>`;

  const pubRenderer = p => `
    <div class="entry">
      <div class="entry-header">
        <div class="entry-title">${p.title}</div>
        <div class="entry-year">${p.year}</div>
      </div>
      <div class="entry-meta">${[p.publisherName, p.researchDomain, p.doi ? 'DOI: ' + p.doi : ''].filter(Boolean).join(' • ')}</div>
    </div>`;

  const actRenderer = a => `
    <div class="entry">
      <div class="entry-header">
        <div class="entry-title">${a.eventName}</div>
        <div class="entry-year">${a.startDate ? new Date(a.startDate).getFullYear() : ''}</div>
      </div>
      <div class="entry-meta">${[a.organizer, a.level, 'Role: ' + a.role].filter(Boolean).join(' • ')}</div>
    </div>`;

  return `<html><head><style>${styles}</style></head><body>
    <div class="container">
      <table class="header-table">
        <tr>
          <td class="photo-cell">
            <img src="${photo}" class="photo-frame" />
          </td>
          <td class="profile-cell">
            <h1 class="name">${profile.fullName}</h1>
            <table class="info-table">
              ${profileRows.map(row => `
                <tr>
                  <td class="info-label">${row.label}</td>
                  <td class="info-colon">:</td>
                  <td class="info-value">${row.value}</td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>
      </table>

      ${summary ? `<div class="summary-box">${summary}</div>` : ''}

      ${(profile.sintaId || profile.scopusId || profile.wosId || profile.googleScholarId) ? `
        <div class="section">
          <div class="section-title">Academic Identifiers</div>
          <div style="display: block;">
            ${profile.sintaId ? `<span class="id-badge">SINTA: ${profile.sintaId}</span>` : ''}
            ${profile.scopusId ? `<span class="id-badge">SCOPUS: ${profile.scopusId}</span>` : ''}
            ${profile.wosId ? `<span class="id-badge">WoS: ${profile.wosId}</span>` : ''}
            ${profile.googleScholarId ? `<span class="id-badge">SCHOLAR: ${profile.googleScholarId}</span>` : ''}
          </div>
        </div>
      ` : ''}

      ${renderSection("Education", edu, eduRenderer, true)}
      ${renderSection("Career Journey", career, careerRenderer, true)}
      ${renderSection("Scientific Publications", pubs, pubRenderer)}
      ${renderSection("Academic Activities", acts, actRenderer)}

    </div>
    <div class="footer">
      M A D E &nbsp; W I T H &nbsp; X E E N A P S &nbsp; &mdash; &nbsp; S M A R T &nbsp; S C H O L A R &nbsp; E C O S Y S T E M 
      <img src="${logoUrl}" style="width: 14px; height: 14px; vertical-align: middle; margin-left: 12px;" />
    </div>
  </body></html>`;
}