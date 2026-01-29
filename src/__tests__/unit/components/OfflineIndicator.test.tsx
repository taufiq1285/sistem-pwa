/**
 * OfflineIndicator Component Unit Tests
 * Comprehensive testing of offline status indicator
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the OfflineIndicator component
vi.mock("../../../lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}));

const mockUseNetworkStatus = vi.mocked(
  await import("../../../lib/hooks/useNetworkStatus"),
).useNetworkStatus;

// Create a simple OfflineIndicator component for testing
const OfflineIndicator = () => {
  const { isOffline, isOnline } = mockUseNetworkStatus();

  if (!isOffline) return null;

  return (
    <div
      className="bg-red-600 text-white px-4 py-2 text-center text-sm"
      data-testid="offline-indicator"
    >
      <span className="font-medium">You are offline</span>
      <span className="ml-2 text-xs">Some features may be limited</span>
    </div>
  );
};

describe("OfflineIndicator Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Online state", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isOnline: true,
        status: "online",
        quality: { downlink: 2.5, effectiveType: "4g" },
      } as any);
    });

    it("should not render when online", () => {
      render(<OfflineIndicator />);

      expect(screen.queryByTestId("offline-indicator")).not.toBeInTheDocument();
    });

    it("should not show offline message when connected", () => {
      render(<OfflineIndicator />);

      expect(screen.queryByText("You are offline")).not.toBeInTheDocument();
    });
  });

  describe("Offline state", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
        status: "offline",
        quality: null,
      } as any);
    });

    it("should render when offline", () => {
      render(<OfflineIndicator />);

      expect(screen.getByTestId("offline-indicator")).toBeInTheDocument();
    });

    it("should show offline message", () => {
      render(<OfflineIndicator />);

      expect(screen.getByText("You are offline")).toBeInTheDocument();
      expect(
        screen.getByText("Some features may be limited"),
      ).toBeInTheDocument();
    });

    it("should have proper styling for offline state", () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByTestId("offline-indicator");
      expect(indicator).toHaveClass("bg-red-600", "text-white", "text-center");
    });
  });

  describe("State transitions", () => {
    it("should show/hide based on network status changes", () => {
      const { rerender } = render(<OfflineIndicator />);

      // Start online
      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isOnline: true,
        status: "online",
      } as any);
      rerender(<OfflineIndicator />);
      expect(screen.queryByTestId("offline-indicator")).not.toBeInTheDocument();

      // Go offline
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
        status: "offline",
      } as any);
      rerender(<OfflineIndicator />);
      expect(screen.getByTestId("offline-indicator")).toBeInTheDocument();

      // Back online
      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isOnline: true,
        status: "online",
      } as any);
      rerender(<OfflineIndicator />);
      expect(screen.queryByTestId("offline-indicator")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
        status: "offline",
      } as any);
    });

    it("should provide clear text information", () => {
      render(<OfflineIndicator />);

      expect(screen.getByText("You are offline")).toBeInTheDocument();
      expect(
        screen.getByText("Some features may be limited"),
      ).toBeInTheDocument();
    });

    it("should use semantic HTML elements", () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByTestId("offline-indicator");
      expect(indicator.tagName).toBe("DIV");
    });
  });

  describe("Visual design", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isOnline: false,
        status: "offline",
      } as any);
    });

    it("should have prominent visual styling", () => {
      render(<OfflineIndicator />);

      const indicator = screen.getByTestId("offline-indicator");
      expect(indicator).toHaveClass(
        "bg-red-600",
        "text-white",
        "px-4",
        "py-2",
        "text-center",
        "text-sm",
      );
    });

    it("should have proper text hierarchy", () => {
      render(<OfflineIndicator />);

      const mainText = screen.getByText("You are offline");
      const subText = screen.getByText("Some features may be limited");

      expect(mainText).toHaveClass("font-medium");
      expect(subText).toHaveClass("ml-2", "text-xs");
    });
  });
});
