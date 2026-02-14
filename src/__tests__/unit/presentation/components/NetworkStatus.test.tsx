/**
 * NetworkStatus Component Unit Tests
 * Comprehensive testing of network status display component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NetworkStatus } from "../../../../components/common/NetworkStatus";

// Mock useNetworkStatus hook
vi.mock("../../../../../lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}));

const mockUseNetworkStatus = vi.mocked(
  await import("../../../../../lib/hooks/useNetworkStatus"),
).useNetworkStatus;

describe("NetworkStatus Component", () => {
  const mockOnlineStatus = {
    status: "online",
    isOnline: true,
    isOffline: false,
    quality: {
      downlink: 2.5,
      effectiveType: "4g",
      rtt: 100,
    },
  };

  const mockOfflineStatus = {
    status: "offline",
    isOnline: false,
    isOffline: true,
    quality: null,
  };

  const mockSlowStatus = {
    status: "online",
    isOnline: true,
    isOffline: false,
    quality: {
      downlink: 0.5,
      effectiveType: "slow-2g",
      rtt: 2000,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Online status", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue(mockOnlineStatus);
    });

    it("should display connected status", () => {
      render(<NetworkStatus />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
      expect(screen.getByText("Online")).toBeInTheDocument();
      expect(screen.getByText("online")).toBeInTheDocument();
    });

    it("should show quality metrics by default", () => {
      render(<NetworkStatus />);

      expect(screen.getByText("2.5 Mbps")).toBeInTheDocument();
      expect(screen.getByText("4g")).toBeInTheDocument();
    });

    it("should hide quality when showQuality is false", () => {
      render(<NetworkStatus showQuality={false} />);

      expect(screen.queryByText("2.5 Mbps")).not.toBeInTheDocument();
      expect(screen.queryByText("4g")).not.toBeInTheDocument();
    });

    it("should display wifi icon for online status", () => {
      render(<NetworkStatus />);

      // Check for wifi icon (SVG element)
      const wifiIcon = document.querySelector("svg");
      expect(wifiIcon).toBeInTheDocument();
    });

    it("should show success badge for good connection", () => {
      render(<NetworkStatus />);

      const badge = screen.getByText("Online");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Offline status", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue(mockOfflineStatus);
    });

    it("should display disconnected status", () => {
      render(<NetworkStatus />);

      expect(screen.getByText("Disconnected")).toBeInTheDocument();
      expect(screen.getByText("Offline")).toBeInTheDocument();
      expect(screen.getByText("offline")).toBeInTheDocument();
    });

    it("should not show quality metrics when offline", () => {
      render(<NetworkStatus />);

      expect(screen.queryByText(/Mbps/)).not.toBeInTheDocument();
    });

    it("should show destructive badge for offline", () => {
      render(<NetworkStatus />);

      const badge = screen.getByText("Offline");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Slow connection", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue(mockSlowStatus);
    });

    it("should display slow connection metrics", () => {
      render(<NetworkStatus />);

      expect(screen.getByText("0.5 Mbps")).toBeInTheDocument();
      expect(screen.getByText("slow-2g")).toBeInTheDocument();
    });

    it("should show warning styling for slow connection", () => {
      render(<NetworkStatus />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
      expect(screen.getByText("Online")).toBeInTheDocument();
    });
  });

  describe("Variant rendering", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue(mockOnlineStatus);
    });

    it("should render inline variant by default", () => {
      render(<NetworkStatus />);

      // Should not be wrapped in card
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });

    it("should render card variant when specified", () => {
      render(<NetworkStatus variant="card" />);

      // Should be wrapped in card structure
      const cardContent = document.querySelector(".pt-6");
      expect(cardContent).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<NetworkStatus className="custom-class" />);

      const container = document.querySelector(".custom-class");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Quality handling", () => {
    it("should handle missing quality data", () => {
      mockUseNetworkStatus.mockReturnValue({
        ...mockOnlineStatus,
        quality: null,
      });

      render(<NetworkStatus />);

      expect(screen.queryByText(/Mbps/)).not.toBeInTheDocument();
    });

    it("should handle quality without downlink", () => {
      mockUseNetworkStatus.mockReturnValue({
        ...mockOnlineStatus,
        quality: {
          effectiveType: "4g",
          rtt: 100,
        } as any,
      });

      render(<NetworkStatus />);

      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(screen.getByText("4g")).toBeInTheDocument();
    });

    it("should handle quality without effective type", () => {
      mockUseNetworkStatus.mockReturnValue({
        ...mockOnlineStatus,
        quality: {
          downlink: 1.5,
          rtt: 100,
        } as any,
      });

      render(<NetworkStatus />);

      expect(screen.getByText("1.5 Mbps")).toBeInTheDocument();
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle zero downlink", () => {
      mockUseNetworkStatus.mockReturnValue({
        ...mockOnlineStatus,
        quality: {
          downlink: 0,
          effectiveType: "slow-2g",
          rtt: 3000,
        },
      });

      render(<NetworkStatus />);

      expect(screen.getByText("0.0 Mbps")).toBeInTheDocument();
    });

    it("should handle very high downlink", () => {
      mockUseNetworkStatus.mockReturnValue({
        ...mockOnlineStatus,
        quality: {
          downlink: 100.5,
          effectiveType: "4g",
          rtt: 10,
        },
      });

      render(<NetworkStatus />);

      expect(screen.getByText("100.5 Mbps")).toBeInTheDocument();
    });

    it("should handle undefined status", () => {
      mockUseNetworkStatus.mockReturnValue({
        ...mockOnlineStatus,
        status: undefined as any,
      });

      render(<NetworkStatus />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue(mockOnlineStatus);
    });

    it("should provide meaningful text content", () => {
      render(<NetworkStatus />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
      expect(screen.getByText("2.5 Mbps")).toBeInTheDocument();
      expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("should have proper structure for screen readers", () => {
      render(<NetworkStatus />);

      // Status information should be clearly labeled
      const statusTexts = ["Connected", "online", "2.5 Mbps", "4g", "Online"];

      statusTexts.forEach((text) => {
        expect(screen.getByText(text)).toBeInTheDocument();
      });
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle mobile network scenario", () => {
      mockUseNetworkStatus.mockReturnValue({
        status: "online",
        isOnline: true,
        isOffline: false,
        quality: {
          downlink: 1.2,
          effectiveType: "3g",
          rtt: 800,
        },
      });

      render(<NetworkStatus />);

      expect(screen.getByText("1.2 Mbps")).toBeInTheDocument();
      expect(screen.getByText("3g")).toBeInTheDocument();
    });

    it("should handle wifi scenario", () => {
      mockUseNetworkStatus.mockReturnValue({
        status: "online",
        isOnline: true,
        isOffline: false,
        quality: {
          downlink: 25.0,
          effectiveType: "4g",
          rtt: 50,
        },
      });

      render(<NetworkStatus />);

      expect(screen.getByText("25.0 Mbps")).toBeInTheDocument();
      expect(screen.getByText("4g")).toBeInTheDocument();
    });

    it("should handle intermittent connection", () => {
      const { rerender } = render(<NetworkStatus />);

      // Start online
      mockUseNetworkStatus.mockReturnValue(mockOnlineStatus);
      rerender(<NetworkStatus />);
      expect(screen.getByText("Connected")).toBeInTheDocument();

      // Go offline
      mockUseNetworkStatus.mockReturnValue(mockOfflineStatus);
      rerender(<NetworkStatus />);
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });
  });
});
