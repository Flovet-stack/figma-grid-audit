import { FigmaGridAudit, AuditOptions } from '../core';

export function initVueFigmaGridAudit(options: AuditOptions, app: any) {
  if (process.env.NODE_ENV === 'development') {
    const audit = FigmaGridAudit.init(options);

    // Use Vue's app.unmount or a global cleanup if necessary
    // But since it's a global overlay, we typically initialize it once at the app root
    return audit;
  }
  return null;
}

/**
 * Example Vue Plugin implementation
 */
export const FigmaGridAuditPlugin = {
  install(app: any, options: AuditOptions) {
    if (process.env.NODE_ENV === 'development') {
      FigmaGridAudit.init(options);
    }
  }
};
