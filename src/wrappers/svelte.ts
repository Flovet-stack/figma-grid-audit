import { FigmaGridAudit, AuditOptions } from '../core';

export function initSvelteFigmaGridAudit(options: AuditOptions) {
  if (process.env.NODE_ENV === 'development') {
    return FigmaGridAudit.init(options);
  }
  return null;
}
