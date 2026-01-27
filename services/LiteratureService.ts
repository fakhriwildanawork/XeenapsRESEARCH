import { LiteratureArticle, ArchivedArticleItem, GASResponse } from '../types';
import { GAS_WEB_APP_URL } from '../constants';

/**
 * XEENAPS LITERATURE SEARCH SERVICE
 * Integrasi Semantic Scholar (Discovery) & GAS (Archiving)
 */

export const searchArticles = async (
  query: string, 
  yearStart?: number, 
  yearEnd?: number,
  limit: number = 12
): Promise<LiteratureArticle[]> => {
  try {
    const fields = 'paperId,title,authors,year,doi,url,venue,citationCount,abstract';
    const yearRange = yearStart && yearEnd ? `&year=${yearStart}-${yearEnd}` : '';
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}${yearRange}&fields=${fields}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Search API failed');
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Search articles error:", error);
    return [];
  }
};

export const fetchArchivedArticles = async (): Promise<ArchivedArticleItem[]> => {
  if (!GAS_WEB_APP_URL) return [];
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getArchivedArticles`);
    const result: GASResponse<ArchivedArticleItem[]> = await response.json();
    return result.status === 'success' ? (result.data || []) : [];
  } catch (error) {
    return [];
  }
};

export const archiveArticle = async (article: LiteratureArticle, label: string): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    // Generate Harvard Citation
    const authorList = article.authors?.map(a => a.name).join(', ') || 'Anonymous';
    const citation = `${authorList} (${article.year || 'n.d.'}). '${article.title}'. ${article.venue || 'Global Database'}.`;

    const archivedItem: Partial<ArchivedArticleItem> = {
      id: crypto.randomUUID(),
      title: article.title,
      citationHarvard: citation,
      doi: article.doi || '',
      url: article.url || '',
      info: article.abstract || '',
      label: label.toUpperCase(),
      isFavorite: false,
      createdAt: new Date().toISOString()
    };

    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'saveArchivedArticle', item: archivedItem })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    return false;
  }
};

export const deleteArchivedArticle = async (id: string): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteArchivedArticle', id })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    return false;
  }
};

export const toggleFavoriteArticle = async (id: string, status: boolean): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'toggleFavoriteArticle', id, status })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    return false;
  }
};