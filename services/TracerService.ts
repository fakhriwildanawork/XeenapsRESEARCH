import { TracerProject, TracerLog, TracerReference, TracerQuote, GASResponse } from '../types';
import { GAS_WEB_APP_URL } from '../constants';

/**
 * XEENAPS TRACER SERVICE
 * Managing Research Audit Trails, Heatmaps, and AI-Powered Reference Quoting.
 */

export const fetchTracerProjects = async (
  page: number = 1,
  limit: number = 25,
  search: string = "",
  signal?: AbortSignal
): Promise<{ items: TracerProject[], totalCount: number }> => {
  if (!GAS_WEB_APP_URL) return { items: [], totalCount: 0 };
  try {
    const url = `${GAS_WEB_APP_URL}?action=getTracerProjects&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    const res = await fetch(url, { signal });
    const result = await res.json();
    return { 
      items: result.data || [], 
      totalCount: result.totalCount || 0 
    };
  } catch (error) {
    return { items: [], totalCount: 0 };
  }
};

export const saveTracerProject = async (item: TracerProject): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'saveTracerProject', item })
    });
    const result = await res.json();
    return result.status === 'success';
  } catch (e) {
    return false;
  }
};

export const deleteTracerProject = async (id: string): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteTracerProject', id })
    });
    const result = await res.json();
    return result.status === 'success';
  } catch (e) {
    return false;
  }
};

export const fetchTracerLogs = async (projectId: string): Promise<TracerLog[]> => {
  if (!GAS_WEB_APP_URL) return [];
  try {
    const url = `${GAS_WEB_APP_URL}?action=getTracerLogs&projectId=${projectId}`;
    const res = await fetch(url);
    const result = await res.json();
    return result.data || [];
  } catch (e) {
    return [];
  }
};

export const saveTracerLog = async (item: TracerLog, content: { description: string }): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'saveTracerLog', item, content })
    });
    const result = await res.json();
    return result.status === 'success';
  } catch (e) {
    return false;
  }
};

export const fetchTracerReferences = async (projectId: string): Promise<TracerReference[]> => {
  if (!GAS_WEB_APP_URL) return [];
  try {
    const url = `${GAS_WEB_APP_URL}?action=getTracerReferences&projectId=${projectId}`;
    const res = await fetch(url);
    const result = await res.json();
    return result.data || [];
  } catch (e) {
    return [];
  }
};

export const linkTracerReference = async (item: Partial<TracerReference>): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'linkTracerReference', item })
    });
    const result = await res.json();
    return result.status === 'success';
  } catch (e) {
    return false;
  }
};

export const unlinkTracerReference = async (id: string): Promise<boolean> => {
  if (!GAS_WEB_APP_URL) return false;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'unlinkTracerReference', id })
    });
    const result = await res.json();
    return result.status === 'success';
  } catch (e) {
    return false;
  }
};

/**
 * AI TRACER: Quote Extraction via Groq
 */
export const extractTracerQuote = async (collectionId: string, contextQuery: string): Promise<Partial<TracerQuote> | null> => {
  if (!GAS_WEB_APP_URL) return null;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'aiTracerProxy', 
        subAction: 'extractQuote', 
        payload: { collectionId, contextQuery } 
      })
    });
    const result = await res.json();
    return result.status === 'success' ? result.data : null;
  } catch (e) {
    return null;
  }
};

/**
 * AI TRACER: Academic Enhancement via Groq
 */
export const enhanceTracerQuote = async (originalText: string, citation: string): Promise<string | null> => {
  if (!GAS_WEB_APP_URL) return null;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'aiTracerProxy', 
        subAction: 'enhanceQuote', 
        payload: { originalText, citation } 
      })
    });
    const result = await res.json();
    return result.status === 'success' ? result.data : null;
  } catch (e) {
    return null;
  }
};