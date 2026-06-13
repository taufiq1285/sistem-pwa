/**
 * SidebarContext shares desktop collapse and mobile drawer state across layout components.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

interface SidebarContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (value: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

interface SidebarProviderProps {
  children: ReactNode;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined,
);

function getInitialCollapsedState(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

export function SidebarProvider({
  children,
}: SidebarProviderProps): ReactElement {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    getInitialCollapsedState,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapsed = useCallback((): void => {
    setIsCollapsed((current) => !current);
  }, []);

  const openDrawer = useCallback((): void => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback((): void => {
    setIsDrawerOpen(false);
  }, []);

  const value = useMemo<SidebarContextValue>(
    () => ({
      isCollapsed,
      setIsCollapsed,
      toggleCollapsed,
      isDrawerOpen,
      setIsDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [closeDrawer, isCollapsed, isDrawerOpen, openDrawer, toggleCollapsed],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);

  if (!context) {
    return {
      isCollapsed: false,
      setIsCollapsed: () => {},
      toggleCollapsed: () => {},
      isDrawerOpen: false,
      setIsDrawerOpen: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
    };
  }

  return context;
}
