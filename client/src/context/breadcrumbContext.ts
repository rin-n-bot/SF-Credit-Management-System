import { createContext, useContext } from 'react';

interface BreadcrumbContextValue {
  customLabel: string | null;
  setCustomLabel: (label: string | null) => void;
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  customLabel: null,
  setCustomLabel: () => {},
});

export const useBreadcrumb = () => useContext(BreadcrumbContext);