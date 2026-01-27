/**
 * XEENAPS PKM - GLOBAL CONFIGURATION
 */
const CONFIG = {
  FOLDERS: {
    MAIN_LIBRARY: '1CUvptRGnncn0M-vZdLCb1XBUmAeM9G8B'
  },
  STORAGE: {
    THRESHOLD: 5 * 1024 * 1024 * 1024, // 5 GB in bytes
    CRITICAL_THRESHOLD: 2 * 1024 * 1024 * 1024, // 2 GB for Link/Ref
    REGISTRY_SHEET: 'StorageNodes'
  },
  SPREADSHEETS: {
    LIBRARY: '1ROW4iyHN10DfDWaXL7O54mZi6Da9Xx70vU6oE-YW-I8',
    KEYS: '1Ji8XL2ceTprNa1dYvhfTnMDkWwzC937kpfyP19D7NvI',
    AI_CONFIG: '1RVYM2-U5LRb8S8JElRSEv2ICHdlOp9pnulcAM8Nd44s',
    STORAGE_REGISTRY: '1qBzgjhUv_aAFh5cLb8SqIt83bOdUFRfRXZz4TxyEZDw',
    PRESENTATION: '1Sfng6xCz2d4NAmBZFgyjZ9Fy8X1k149c7ohXS9uO2r8',
    QUESTION_BANK: '14ZbesZJvLLr3d1rhTW_L4E_D6gqWj_e7AJIiLJ2b5OU',
    RESEARCH: '1XRmeIuj2vyXO9a0BFwODdkMNd_o7bmPIw9KHQOtFhoE',
    BRAINSTORMING: '1nMC1fO5kLdzO4W9O_sPK2tfL1K_GGQ-lE7g2Un76OrM'
  },
  SCHEMAS: {
    LIBRARY: [
      'id', 
      'title', 
      'type', 
      'category', 
      'topic', 
      'subTopic', 
      'authors', // Merged JSON Array
      'publisher', 
      'year', 
      'fullDate',
      'pubInfo', // Merged JSON Object (journal, vol, issue, pages)
      'identifiers', // Merged JSON Object (doi, issn, isbn, pmid, arxiv, bibcode)
      'source', 
      'format', 
      'url', 
      'fileId', 
      'imageView', 
      'youtubeId', 
      'tags', // Merged JSON Object (keywords, labels)
      'abstract', 
      'mainInfo', // Search Indexer (Plain Text)
      'extractedJsonId', 
      'insightJsonId', 
      'storageNodeUrl',
      'isFavorite', 
      'isBookmarked', 
      'createdAt', 
      'updatedAt',
      'supportingReferences'
    ],
    PRESENTATIONS: [
      'id',
      'collectionIds',
      'gSlidesId',
      'title',
      'presenters',
      'templateName',
      'themeConfig',
      'slidesCount',
      'storageNodeUrl',
      'createdAt',
      'updatedAt'
    ],
    QUESTIONS: [
      'id',
      'collectionId',
      'bloomLevel',
      'customLabel',
      'questionText',
      'options', // JSON String Array of Objects
      'correctAnswer', // Key A-E
      'reasoningCorrect',
      'reasoningDistractors', // JSON Object Map
      'verbatimReference', // Grounding from source text
      'language',
      'createdAt'
    ],
    RESEARCH_PROJECTS: [
      'id',
      'projectName',
      'language',
      'status',
      'isFavorite',
      'isUsed',
      'proposedTitle',
      'noveltyNarrative',
      'futureDirections',
      'createdAt',
      'updatedAt'
    ],
    PROJECT_SOURCES: [
      'id',
      'projectId',
      'sourceId',
      'title',
      'findings',
      'methodology',
      'limitations',
      'createdAt',
      'isFavorite',
      'isUsed'
    ],
    BRAINSTORMING: [
      'id',
      'label',
      'roughIdea',
      'proposedTitle',
      'problemStatement',
      'researchGap',
      'researchQuestion',
      'methodology',
      'population',
      'keywords', // JSON Array
      'pillars', // JSON Array
      'proposedAbstract',
      'externalRefs', // JSON Array (New)
      'internalRefs', // JSON Array (New)
      'isFavorite',
      'isUsed',
      'createdAt',
      'updatedAt'
    ]
  }
};