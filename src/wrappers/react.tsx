import React, { useEffect } from 'react';
import { FigmaGridAudit, AuditOptions } from '../core';

interface FigmaGridAuditProviderProps {
  options: AuditOptions;
  children?: React.ReactNode;
}

export const FigmaGridAuditProvider: React.FC<FigmaGridAuditProviderProps> = ({ options, children }) => {
  useEffect(() => {
    // Only initialize in development environment
    if (process.env.NODE_ENV === 'development') {
      const audit = FigmaGridAudit.init(options);

      return () => {
        audit.destroy();
      };
    }
  }, [options]);

  return <>{children}</>;
};

/**
 * Simple hook for more granular control over the audit tool
 */
export function useFigmaGridAudit(options: AuditOptions) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const audit = FigmaGridAudit.init(options);
      return () => audit.destroy();
    }
  }, [options]);
}
