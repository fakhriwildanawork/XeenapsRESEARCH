/**
 * XEENAPS CV ARCHITECT - PDF ENGINE V2 (HIGH CONTRAST & ZERO GRAY)
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
    const sortedActs = filteredActs.sort((a,b) => String(b.startDate).localeCompare(String(a.startDate)));

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

    const htmlContent = buildCVHtml(config.template, profile, photoBase64, sortedEdu, sortedCareer, sortedPubs, sortedActs, config.aiSummary);

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

function buildCVHtml(template, profile, photo, edu, career, pubs, acts, summary) {
  const navy = "#004A74";
  const black = "#000000";
  const logoUrl = "https://lh3.googleusercontent.com/d/1ZpVAXWGLDP2C42Fct0bisloaQLf2095_";

  let baseStyles = `
    @page { margin: 0; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; color: ${black}; line-height: 1.5; margin: 0; padding: 0; background: white; }
    .container { padding: 40px; }
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 900; color: ${navy}; border-bottom: 1.5pt solid ${navy}; padding-bottom: 3px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .name { font-size: 28px; font-weight: 900; color: ${navy}; margin: 0; line-height: 1.1; }
    .sub-name { font-size: 14px; font-weight: bold; color: ${black}; margin-top: 4px; }
    .contact-grid { display: table; width: 100%; margin-top: 15px; border-top: 0.5pt solid ${black}; padding-top: 10px; }
    .contact-item { display: table-cell; font-size: 9px; font-weight: bold; color: ${black}; }
    .summary-box { font-size: 11px; font-style: italic; background: #f0f7fa; padding: 15px; border-left: 5px solid ${navy}; margin: 20px 0; color: ${black}; }
    .entry { margin-bottom: 15px; page-break-inside: avoid; }
    .entry-title { font-size: 12px; font-weight: bold; color: ${navy}; margin: 0; }
    .entry-meta { font-size: 10px; font-weight: normal; color: ${black}; font-style: italic; margin-top: 2px; }
    .entry-desc { font-size: 10px; color: ${black}; margin-top: 5px; text-align: justify; }
    .id-badge { display: inline-block; padding: 3px 8px; background: ${navy}; color: white; font-size: 8px; font-weight: bold; border-radius: 4px; margin-right: 5px; margin-top: 5px; }
    .footer { position: fixed; bottom: 20px; left: 40px; right: 40px; border-top: 0.5pt solid #eee; padding-top: 10px; text-align: center; font-size: 8px; font-weight: bold; color: #ccc; text-transform: uppercase; letter-spacing: 2px; }
    .logo-top { position: absolute; top: 40px; right: 40px; width: 35px; height: 35px; }
  `;

  // SHARED BLOCKS
  const academicIdsHtml = `
    <div class="section">
      <div class="section-title">Academic Identifiers</div>
      <div style="display: flex; flex-wrap: wrap;">
        ${profile.sintaId ? `<span class="id-badge">SINTA: ${profile.sintaId}</span>` : ''}
        ${profile.scopusId ? `<span class="id-badge">SCOPUS: ${profile.scopusId}</span>` : ''}
        ${profile.wosId ? `<span class="id-badge">WoS: ${profile.wosId}</span>` : ''}
        ${profile.googleScholarId ? `<span class="id-badge">SCHOLAR: ${profile.googleScholarId}</span>` : ''}
      </div>
    </div>
  `;

  const footerHtml = `<div class="footer">Made with Xeenaps - Smart Scholar Ecosystem</div>`;

  // TEMPLATE A: MODERN ACADEMIC
  if (template === "Template A") {
    return `<html><head><style>${baseStyles} .photo-a { width: 90px; height: 120px; object-fit: cover; border: 1.5pt solid ${navy}; border-radius: 8px; }</style></head><body>
      <img src="${logoUrl}" class="logo-top" />
      <div class="container">
        <table style="width: 100%;"><tr>
          <td style="vertical-align: top;">
            <h1 class="name">${profile.fullName}</h1>
            <div class="sub-name">${profile.jobTitle} • ${profile.affiliation}</div>
            <div class="contact-grid">
              <div class="contact-item">Email: ${profile.email}</div>
              <div class="contact-item">Phone: ${profile.phone}</div>
              <div class="contact-item">Birth: ${profile.birthDate || '-'}</div>
            </div>
            <div style="font-size: 9px; color: ${black}; margin-top: 5px;">Address: ${profile.address}</div>
            <div style="font-size: 9px; color: ${navy}; font-weight: bold; margin-top: 3px;">Social: ${profile.socialMedia || '-'}</div>
          </td>
          <td style="width: 100px; vertical-align: top; text-align: right;">
            <img src="${photo}" class="photo-a" />
          </td>
        </tr></table>

        ${summary ? `<div class="summary-box">${summary}</div>` : ''}
        ${academicIdsHtml}

        <div class="section">
          <div class="section-title">Education</div>
          ${edu.map(e => `<div class="entry"><div class="entry-title">${e.institution} <span style="float: right; color: ${black};">${e.startYear} - ${e.endYear}</span></div><div class="entry-meta">${e.level} in ${e.major} • ${e.degree}</div></div>`).join('')}
        </div>

        <div class="section">
          <div class="section-title">Experience</div>
          ${career.map(c => `<div class="entry"><div class="entry-title">${c.position} <span style="float: right; color: ${black};">${c.startDate} - ${c.endDate}</span></div><div class="entry-meta">${c.company} • ${c.location}</div><div class="entry-desc">${c.description}</div></div>`).join('')}
        </div>

        <div class="section">
          <div class="section-title">Scientific Publications</div>
          ${pubs.map(p => `<div class="entry"><div class="entry-title" style="font-size: 11px;">${p.title}</div><div class="entry-meta" style="color: ${black};">${p.publisherName} (${p.year}) • DOI: ${p.doi || '-'}</div></div>`).join('')}
        </div>

        <div class="section">
          <div class="section-title">Activities & Awards</div>
          ${acts.map(a => `<div class="entry"><div class="entry-title" style="font-size: 11px;">${a.eventName}</div><div class="entry-meta" style="color: ${black};">${a.organizer} (${a.startDate}) • Role: ${a.role}</div></div>`).join('')}
        </div>
      </div>
      ${footerHtml}
    </body></html>`;
  }

  // TEMPLATE B: EXECUTIVE NAVY (Sidebar Style)
  if (template === "Template B") {
    return `<html><head><style>${baseStyles}
      .page { display: table; width: 100%; border-collapse: collapse; }
      .sidebar { display: table-cell; width: 28%; background: ${navy}; color: white; padding: 40px 20px; vertical-align: top; }
      .main { display: table-cell; width: 72%; padding: 40px 30px; vertical-align: top; }
      .side-photo { width: 100%; aspect-ratio: 1; border-radius: 50%; border: 4pt solid rgba(255,255,255,0.2); margin-bottom: 25px; object-fit: cover; }
      .side-title { font-size: 10px; font-weight: 900; color: #FED400; text-transform: uppercase; border-bottom: 1pt solid rgba(255,255,255,0.2); padding-bottom: 5px; margin: 20px 0 10px 0; }
      .side-text { font-size: 9px; color: white; margin-bottom: 8px; font-weight: bold; }
      .main .section-title { border-bottom: 2pt solid ${navy}; }
    </style></head><body>
      <div class="page">
        <div class="sidebar">
          <img src="${photo}" class="side-photo" />
          <h3 class="side-title">Contact</h3>
          <div class="side-text">${profile.email}</div>
          <div class="side-text">${profile.phone}</div>
          <div class="side-text" style="font-size: 8px; opacity: 0.8;">${profile.address}</div>
          <h3 class="side-title">Academic Profile</h3>
          <div class="side-text">SINTA: ${profile.sintaId || '-'}</div>
          <div class="side-text">SCOPUS: ${profile.scopusId || '-'}</div>
          <div class="side-text">WoS: ${profile.wosId || '-'}</div>
          <h3 class="side-title">Socials</h3>
          <div class="side-text">${profile.socialMedia || '-'}</div>
        </div>
        <div class="main">
          <img src="${logoUrl}" style="position: absolute; top: 40px; right: 30px; width: 30px;" />
          <h1 class="name">${profile.fullName}</h1>
          <div class="sub-name" style="color: ${navy};">${profile.jobTitle}</div>
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 20px;">${profile.affiliation}</div>
          ${summary ? `<div class="summary-box" style="background: #f8fafc;">${summary}</div>` : ''}
          
          <div class="section"><div class="section-title">Professional Experience</div>
            ${career.map(c => `<div class="entry"><div class="entry-title">${c.position}</div><div class="entry-meta" style="color: ${black}; font-weight: bold;">${c.company} | ${c.startDate} - ${c.endDate}</div><div class="entry-desc">${c.description}</div></div>`).join('')}
          </div>
          <div class="section"><div class="section-title">Education</div>
            ${edu.map(e => `<div class="entry"><div class="entry-title">${e.institution}</div><div class="entry-meta" style="color: ${black};">${e.level} in ${e.major} (${e.endYear})</div></div>`).join('')}
          </div>
          <div class="section"><div class="section-title">Research Publications</div>
            ${pubs.slice(0,10).map(p => `<div class="entry"><div class="entry-title" style="font-size: 11px;">${p.title}</div><div class="entry-meta" style="color: ${black};">${p.publisherName} (${p.year})</div></div>`).join('')}
          </div>
        </div>
      </div>
      ${footerHtml}
    </body></html>`;
  }

  // TEMPLATE C: INSTITUTIONAL CLASSIC (Minimalist)
  return `<html><head><style>${baseStyles}
    .header-c { text-align: center; border-bottom: 3pt solid ${navy}; padding-bottom: 20px; margin-bottom: 30px; }
    .name-c { font-size: 32px; font-weight: 900; color: ${navy}; margin: 0; }
    .photo-c { width: 80px; height: 105px; border: 1pt solid ${black}; margin: 0 auto 15px auto; display: block; object-fit: cover; }
  </style></head><body>
    <img src="${logoUrl}" class="logo-top" />
    <div class="container">
      <div class="header-c">
        <img src="${photo}" class="photo-c" />
        <h1 class="name-c">${profile.fullName}</h1>
        <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">${profile.jobTitle} at ${profile.affiliation}</div>
        <div style="font-size: 9px; margin-top: 10px;">${profile.email} | ${profile.phone} | ${profile.address}</div>
      </div>

      ${summary ? `<div class="summary-box" style="border: 1pt solid #ddd; background: white; text-align: center;">${summary}</div>` : ''}
      
      <div class="section"><div class="section-title">Academic Qualifications</div>
        ${edu.map(e => `<div class="entry" style="margin-bottom: 8px;"><div class="entry-title" style="color: ${black};">${e.level} - ${e.institution} <span style="float: right;">${e.endYear}</span></div><div class="entry-meta">${e.major} (${e.degree})</div></div>`).join('')}
      </div>

      <div class="section"><div class="section-title">Professional Career</div>
        ${career.map(c => `<div class="entry"><div class="entry-title" style="color: ${black};">${c.position} at ${c.company} <span style="float: right;">${c.startDate} - ${c.endDate}</span></div><div class="entry-desc">${c.description}</div></div>`).join('')}
      </div>

      <div class="section"><div class="section-title">Selected Publications</div>
        ${pubs.map(p => `<div class="entry"><div class="entry-title" style="font-size: 11px;">${p.title}</div><div class="entry-meta" style="color: ${black}; font-weight: bold;">${p.publisherName}, ${p.year}. DOI: ${p.doi || '-'}</div></div>`).join('')}
      </div>

      <div class="section"><div class="section-title">Strategic Identifiers</div>
        <div style="font-size: 10px; font-weight: bold;">SINTA: ${profile.sintaId || '-'} | SCOPUS: ${profile.scopusId || '-'} | WoS: ${profile.wosId || '-'} | Scholar: ${profile.googleScholarId || '-'}</div>
      </div>
    </div>
    ${footerHtml}
  </body></html>`;
}