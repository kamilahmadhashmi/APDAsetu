/* ==========================================================================
   RESQNET SMARTPHONE SIMULATOR — i18n ADAPTER LAYER
   Re-exports from central i18nService for backward compatibility.
   ========================================================================== */

import { i18nService, t } from './services/i18n-service.js';

export const tSim = (key, params) => i18nService.t(key, params);
export const setSimLanguage = (lang) => i18nService.setLanguage(lang);
export const getSimLanguage = () => i18nService.getLanguage();

export {
  SUPPORTED_LANGUAGES,
  translations,
  i18nService,
  t
} from './services/i18n-service.js';
