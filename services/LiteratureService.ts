import { LiteratureArticle, ArchivedArticleItem, GASResponse } from '../types';
import { GAS_WEB_APP_URL } from '../constants';

/**
 * XEENAPS LITERATURE SEARCH SERVICE
 * Integrasi OpenAlex (Discovery via GAS Proxy) & GAS (Archiving)
 */

export const searchArticles = async (
  query: string, 
  yearStart?: number, 
  yearEnd?: number,
  limit: number = 12
): Promise<LiteratureArticle[]> => {
  if (!GAS_WEB_APP_URL) return [];
  try {
    // REDIRECT: Pemanggilan dialihkan ke GAS Web App (Proxy) untuk menghindari CORS
    // Menggunakan OpenAlex di backend untuk menghindari Error 429 dan 400.
    const url = `${GAS_WEB_APP_URL}?action=searchGlobalArticles&query=${encodeURIComponent(query)}&yearStart=${yearStart || ''}&yearEnd=${yearEnd || ''}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Proxy Search failed');
    
    const result = await response.json();
    if (result.status === 'success') {
      return result.data || [];
    } else {
      console.warn("Search Proxy Warning:", result.message);
      return [];
    }
  } catch (error) {
    console.error("Search articles exception:", error);
    return [];
  }
};

/**
 * Fetch Archived Articles with Pagination and Filtering Support
 */
export const fetchArchivedArticlesPaginated = async (
  page: number = 1,
  limit: number = 25,
  search: string = "",
  sortKey: string = "createdAt",
  sortDir: string = "desc",
  signal?: AbortSignal
): Promise<{ items: ArchivedArticleItem[], totalCount: number }> => {
  if (!GAS_WEB_APP_URL) return { items: [], totalCount: 0 };
  try {
    const url = `${GAS_WEB_APP_URL}?action=getArchivedArticles&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sortKey=${sortKey}&sortDir=${sortDir}`;
    const response = await fetch(url, { signal });
    const result: GASResponse<{ items: ArchivedArticleItem[], totalCount: number }> = await response.json();
    
    // The legacy structure from registry returns data as array, 
    // we need to handle both direct array or paginated object from Main.gs
    if ((result as any).status === 'success') {
      return {
        items: (result as any).data || [],
        totalCount: (result as any).totalCount || 0
      };
    }
    return { items: [], totalCount: 0 };
  } catch (error) {
    return { items: [], totalCount: 0 };
  }
};

// Legacy fallback wrapper
export const fetchArchivedArticles = async (): Promise<ArchivedArticleItem[]> => {
  const result = await fetchArchivedArticlesPaginated(1, 1000);
  return result.items;
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
      info: article.abstract || '', // Typically empty string based on recent instructions
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