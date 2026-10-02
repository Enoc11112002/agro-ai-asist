import { Rancho, RanchoZone, Parcel, RanchoWizardDraft } from '../types';

// Updated storage key to guarantee pristine clean state with ZERO mock/fake data
const STORAGE_KEY_RANCHOS = 'agro_ai_asist_ranchos_v4_clean';
const STORAGE_KEY_WIZARD_DRAFT = 'agro_ai_asist_wizard_draft_v4_clean';

// System starts completely clean: ZERO pre-loaded fictional ranches or parcels
export const INITIAL_RANCHOS: Rancho[] = [];

/**
 * Storage helpers for Ranchos & Parcels
 */
export function getSavedRanchos(): Rancho[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RANCHOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Error loading ranchos from localStorage:', err);
  }
  return [];
}

export function saveRanchos(ranchos: Rancho[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RANCHOS, JSON.stringify(ranchos));
  } catch (err) {
    console.error('Error saving ranchos to localStorage:', err);
  }
}

export function clearAllRanchos(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_RANCHOS);
    localStorage.removeItem('agro_ai_asist_ranchos_v1');
    localStorage.removeItem('agro_ai_asist_ranchos_v2');
    localStorage.removeItem('agro_ai_asist_ranchos_clean_v3');
  } catch (err) {
    console.error('Error clearing ranchos:', err);
  }
}

/**
 * Storage helpers for Rancho Wizard Draft (save mid-work and resume)
 */
export function getSavedWizardDraft(): RanchoWizardDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WIZARD_DRAFT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading draft from localStorage:', err);
    return null;
  }
}

export function saveWizardDraft(draft: RanchoWizardDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY_WIZARD_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.error('Error saving draft to localStorage:', err);
  }
}

export function clearWizardDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_WIZARD_DRAFT);
    localStorage.removeItem('agro_ai_asist_wizard_draft_clean_v3');
  } catch (err) {
    console.error('Error clearing draft:', err);
  }
}
