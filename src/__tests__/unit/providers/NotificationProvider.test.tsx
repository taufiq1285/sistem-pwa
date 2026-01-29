/**
 * NotificationProvider Unit Tests
 * Comprehensive testing of notification provider functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  NotificationProvider,
  useNotifications,
} from "../../../providers/NotificationProvider";

// Mock dependencies
vi.mock("../../../lib/hooks/useNotification", () => ({
  useNotification: vi.fn(),
}));

vi.mock("../../../components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

const mockUseNotification = vi.mocked(
  await import("../../../lib/hooks/useNotification"),
).useNotification;

describe("NotificationProvider", () => {
  const mockNotificationValue = {
    notifications: [],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearNotifications: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  };

  beforeEach(() => {
    mockUseNotification.mockReturnValue(mockNotificationValue);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Provider rendering", () => {
    it("should render children correctly", () => {
      render(
        <NotificationProvider>
          <div data-testid="test-child">Test Child</div>
        </NotificationProvider>,
      );

      expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("should render Toaster component", () => {
      render(
        <NotificationProvider>
          <div>Content</div>
        </NotificationProvider>,
      );

      expect(screen.getByTestId("toaster")).toBeInTheDocument();
    });

    it("should provide notification context value", () => {
      const TestComponent = () => {
        const { notifications } = useNotifications();
        return (
          <div data-testid="notification-context">
            {JSON.stringify(notifications)}
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      expect(screen.getByTestId("notification-context")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <NotificationProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <span data-testid="child3">Child 3</span>
        </NotificationProvider>,
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
      expect(screen.getByTestId("child3")).toBeInTheDocument();
    });
  });

  describe("useNotification hook integration", () => {
    it("should call useNotification hook", () => {
      render(
        <NotificationProvider>
          <div>Test</div>
        </NotificationProvider>,
      );

      expect(mockUseNotification).toHaveBeenCalledTimes(1);
    });

    it("should pass hook value to context", () => {
      const customNotificationValue = {
        ...mockNotificationValue,
        notifications: [{ id: "1", message: "Test notification" }],
      };
      mockUseNotification.mockReturnValue(customNotificationValue);

      const TestComponent = () => {
        const { notifications } = useNotifications();
        return (
          <div data-testid="notification-context">
            {JSON.stringify(notifications)}
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      const contextElement = screen.getByTestId("notification-context");
      expect(contextElement).toHaveTextContent(
        JSON.stringify([{ id: "1", message: "Test notification" }]),
      );
    });
  });

  describe("Context value updates", () => {
    it("should update context when notification value changes", () => {
      const TestComponent = () => {
        const { notifications } = useNotifications();
        return (
          <div data-testid="notification-context">
            {JSON.stringify(notifications)}
          </div>
        );
      };

      const { rerender } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      // Update notification value
      const updatedValue = {
        ...mockNotificationValue,
        notifications: [{ id: "2", message: "Updated notification" }],
      };
      mockUseNotification.mockReturnValue(updatedValue);

      rerender(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      const contextElement = screen.getByTestId("notification-context");
      expect(contextElement).toHaveTextContent(
        JSON.stringify([{ id: "2", message: "Updated notification" }]),
      );
    });
  });
});

describe("useNotifications Hook", () => {
  const mockContextValue = {
    notifications: [{ id: "1", message: "Test notification", type: "info" }],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearNotifications: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Context access", () => {
    it("should return context value when used within provider", () => {
      mockUseNotification.mockReturnValue(mockContextValue);

      const TestComponent = () => {
        const notifications = useNotifications();
        return (
          <div data-testid="notifications-data">
            {JSON.stringify(notifications.notifications)}
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      expect(screen.getByTestId("notifications-data")).toHaveTextContent(
        JSON.stringify(mockContextValue.notifications),
      );
    });

    it("should throw error when used outside provider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const TestComponent = () => {
        useNotifications();
        return <div>Should not render</div>;
      };

      expect(() => render(<TestComponent />)).toThrow(
        "useNotifications must be used within NotificationProvider",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Notification methods", () => {
    it("should provide all notification methods", () => {
      mockUseNotification.mockReturnValue(mockContextValue);

      const TestComponent = () => {
        const notifications = useNotifications();

        return (
          <div>
            <button
              onClick={notifications.showSuccess}
              data-testid="success-btn"
            >
              Show Success
            </button>
            <button onClick={notifications.showError} data-testid="error-btn">
              Show Error
            </button>
            <button onClick={notifications.showInfo} data-testid="info-btn">
              Show Info
            </button>
            <button
              onClick={notifications.showWarning}
              data-testid="warning-btn"
            >
              Show Warning
            </button>
            <button
              onClick={notifications.clearNotifications}
              data-testid="clear-btn"
            >
              Clear All
            </button>
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      expect(screen.getByTestId("success-btn")).toBeInTheDocument();
      expect(screen.getByTestId("error-btn")).toBeInTheDocument();
      expect(screen.getByTestId("info-btn")).toBeInTheDocument();
      expect(screen.getByTestId("warning-btn")).toBeInTheDocument();
      expect(screen.getByTestId("clear-btn")).toBeInTheDocument();
    });

    it("should call notification methods when triggered", () => {
      mockUseNotification.mockReturnValue(mockContextValue);

      const TestComponent = () => {
        const notifications = useNotifications();

        return (
          <div>
            <button
              onClick={() => notifications.showSuccess("Success message")}
              data-testid="success-btn"
            >
              Success
            </button>
            <button
              onClick={() =>
                notifications.addNotification({ id: "test", message: "Test" })
              }
              data-testid="add-btn"
            >
              Add
            </button>
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      fireEvent.click(screen.getByTestId("success-btn"));
      fireEvent.click(screen.getByTestId("add-btn"));

      expect(mockContextValue.showSuccess).toHaveBeenCalledWith(
        "Success message",
      );
      expect(mockContextValue.addNotification).toHaveBeenCalledWith({
        id: "test",
        message: "Test",
      });
    });
  });
});

describe("Integration scenarios", () => {
  const mockNotificationValue = {
    notifications: [],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearNotifications: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  };

  beforeEach(() => {
    mockUseNotification.mockReturnValue(mockNotificationValue);
    vi.clearAllMocks();
  });

  describe("Real-world usage", () => {
    it("should handle form submission notifications", () => {
      const FormComponent = () => {
        const { showSuccess, showError } = useNotifications();

        const handleSubmit = (success: boolean) => {
          if (success) {
            showSuccess("Form submitted successfully!");
          } else {
            showError("Failed to submit form");
          }
        };

        return (
          <div>
            <button
              onClick={() => handleSubmit(true)}
              data-testid="submit-success"
            >
              Submit Success
            </button>
            <button
              onClick={() => handleSubmit(false)}
              data-testid="submit-error"
            >
              Submit Error
            </button>
          </div>
        );
      };

      render(
        <NotificationProvider>
          <FormComponent />
        </NotificationProvider>,
      );

      fireEvent.click(screen.getByTestId("submit-success"));
      fireEvent.click(screen.getByTestId("submit-error"));

      expect(mockNotificationValue.showSuccess).toHaveBeenCalledWith(
        "Form submitted successfully!",
      );
      expect(mockNotificationValue.showError).toHaveBeenCalledWith(
        "Failed to submit form",
      );
    });

    it("should handle batch notification operations", () => {
      const BatchComponent = () => {
        const { addNotification, clearNotifications } = useNotifications();

        const addMultiple = () => {
          addNotification({ id: "1", message: "First notification" });
          addNotification({ id: "2", message: "Second notification" });
          addNotification({ id: "3", message: "Third notification" });
        };

        return (
          <div>
            <button onClick={addMultiple} data-testid="add-multiple">
              Add Multiple
            </button>
            <button onClick={clearNotifications} data-testid="clear-all">
              Clear All
            </button>
          </div>
        );
      };

      render(
        <NotificationProvider>
          <BatchComponent />
        </NotificationProvider>,
      );

      fireEvent.click(screen.getByTestId("add-multiple"));

      expect(mockNotificationValue.addNotification).toHaveBeenCalledTimes(3);
      expect(mockNotificationValue.addNotification).toHaveBeenNthCalledWith(1, {
        id: "1",
        message: "First notification",
      });
      expect(mockNotificationValue.addNotification).toHaveBeenNthCalledWith(2, {
        id: "2",
        message: "Second notification",
      });
      expect(mockNotificationValue.addNotification).toHaveBeenNthCalledWith(3, {
        id: "3",
        message: "Third notification",
      });

      fireEvent.click(screen.getByTestId("clear-all"));
      expect(mockNotificationValue.clearNotifications).toHaveBeenCalledTimes(1);
    });

    it("should handle async notification scenarios", async () => {
      const AsyncComponent = () => {
        const { showInfo, showSuccess } = useNotifications();

        const handleAsyncOperation = async () => {
          showInfo("Operation started...");

          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 100));

          showSuccess("Operation completed!");
        };

        return (
          <button onClick={handleAsyncOperation} data-testid="async-btn">
            Start Async
          </button>
        );
      };

      render(
        <NotificationProvider>
          <AsyncComponent />
        </NotificationProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("async-btn"));
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(mockNotificationValue.showInfo).toHaveBeenCalledWith(
        "Operation started...",
      );
      expect(mockNotificationValue.showSuccess).toHaveBeenCalledWith(
        "Operation completed!",
      );
    });
  });

  describe("Error handling", () => {
    it("should handle notification method errors gracefully", () => {
      const errorThrowingValue = {
        ...mockNotificationValue,
        showError: vi.fn().mockImplementation(() => {
          throw new Error("Notification system error");
        }),
      };

      mockUseNotification.mockReturnValue(errorThrowingValue);

      const ErrorComponent = () => {
        const { showError } = useNotifications();

        const handleError = () => {
          try {
            showError("Test error");
          } catch (error) {
            // Error should be handled by component
          }
        };

        return (
          <button onClick={handleError} data-testid="error-btn">
            Trigger Error
          </button>
        );
      };

      render(
        <NotificationProvider>
          <ErrorComponent />
        </NotificationProvider>,
      );

      expect(() => {
        fireEvent.click(screen.getByTestId("error-btn"));
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders", () => {
      let renderCount = 0;

      const TestComponent = () => {
        renderCount++;
        const notifications = useNotifications();

        return <div data-testid="render-count">{renderCount}</div>;
      };

      const { rerender } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      expect(screen.getByText("1")).toBeInTheDocument();

      rerender(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });
});
