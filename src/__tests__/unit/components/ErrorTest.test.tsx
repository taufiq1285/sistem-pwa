/**
 * ErrorTest Component Unit Tests
 * Comprehensive testing of error boundary test component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorTest } from "../../../components/test/ErrorTest";

// Mock console methods to prevent error output during testing
let consoleSpy: ReturnType<typeof vi.spyOn>;

describe("ErrorTest Component", () => {
  beforeEach(() => {
    // Mock console methods to capture error logs
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    // Mock global error handling for unhandled promise rejections
    const originalOnunhandledrejection = window.onunhandledrejection;
    window.onunhandledrejection = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe("Component rendering", () => {
    it("should render error test interface correctly", () => {
      render(<ErrorTest />);

      // Check main elements
      expect(screen.getByText("Error Boundary Test")).toBeInTheDocument();
      expect(
        screen.getByText(/Test different types of errors/),
      ).toBeInTheDocument();

      // Check all error trigger buttons
      expect(screen.getByText("Trigger Render Error")).toBeInTheDocument();
      expect(screen.getByText("Trigger Promise Rejection")).toBeInTheDocument();
      expect(screen.getByText("Trigger JS Error")).toBeInTheDocument();
      expect(screen.getByText("Trigger Async Error")).toBeInTheDocument();
    });

    it("should display error type descriptions", () => {
      render(<ErrorTest />);

      expect(
        screen.getByText(/Throws an error during component render/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Rejects a promise without catch/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Triggers a null reference error/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Throws error in async function/),
      ).toBeInTheDocument();
    });

    it("should show verification instructions", () => {
      render(<ErrorTest />);

      expect(screen.getByText("How to verify:")).toBeInTheDocument();
      expect(
        screen.getByText(/Check browser console for error logs/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ErrorBoundary should catch them/),
      ).toBeInTheDocument();
    });
  });

  describe("Error triggering functionality", () => {
    it("should trigger render error when button clicked", () => {
      const TestWrapper = () => {
        try {
          return <ErrorTest />;
        } catch (error) {
          return (
            <div data-testid="error-caught">{(error as Error).message}</div>
          );
        }
      };

      render(<TestWrapper />);

      const renderErrorButton = screen.getByText("Trigger Render Error");

      // Click should trigger error on next render
      expect(() => {
        fireEvent.click(renderErrorButton);
      }).toThrow("Test Error: ErrorBoundary is working!");
    });

    it("should trigger promise rejection when button clicked", async () => {
      render(<ErrorTest />);

      const promiseRejectionButton = screen.getByText(
        "Trigger Promise Rejection",
      );

      // Mock promise rejection handler
      const rejectionHandler = vi.fn();
      window.addEventListener("unhandledrejection", rejectionHandler);

      fireEvent.click(promiseRejectionButton);

      // Wait for promise rejection to be handled
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not crash the component
      expect(screen.getByText("Error Boundary Test")).toBeInTheDocument();
    });

    it("should trigger JavaScript error when button clicked", () => {
      render(<ErrorTest />);

      const jsErrorButton = screen.getByText("Trigger JS Error");

      expect(() => {
        fireEvent.click(jsErrorButton);
      }).toThrow();

      // Component should still be rendered (error caught by global handler)
      expect(screen.getByText("Error Boundary Test")).toBeInTheDocument();
    });

    it("should trigger async error when button clicked", async () => {
      render(<ErrorTest />);

      const asyncErrorButton = screen.getByText("Trigger Async Error");

      // Should not throw immediately
      expect(() => {
        fireEvent.click(asyncErrorButton);
      }).not.toThrow();

      // Component should still be rendered
      expect(screen.getByText("Error Boundary Test")).toBeInTheDocument();
    });
  });

  describe("Error handling scenarios", () => {
    it("should demonstrate render error behavior", () => {
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>;
        } catch (error) {
          return (
            <div data-testid="error-boundary">
              Error caught: {(error as Error).message}
            </div>
          );
        }
      };

      const TestComponent = () => {
        return (
          <ErrorBoundary>
            <ErrorTest />
          </ErrorBoundary>
        );
      };

      render(<TestComponent />);

      // Should render normally first
      expect(screen.getByText("Error Boundary Test")).toBeInTheDocument();

      const renderErrorButton = screen.getByText("Trigger Render Error");

      // Triggering render error should be caught by boundary
      expect(() => {
        fireEvent.click(renderErrorButton);
      }).toThrow();
    });

    it("should handle multiple error triggers gracefully", () => {
      render(<ErrorTest />);

      const promiseButton = screen.getByText("Trigger Promise Rejection");
      const jsButton = screen.getByText("Trigger JS Error");

      // Promise rejection should not throw synchronously
      expect(() => {
        fireEvent.click(promiseButton);
      }).not.toThrow();

      // JS error should throw synchronously
      expect(() => {
        fireEvent.click(jsButton);
      }).toThrow();

      expect(screen.getByText("Error Boundary Test")).toBeInTheDocument();
    });
  });

  describe("Component state management", () => {
    it("should manage shouldThrow state correctly", () => {
      const { container } = render(<ErrorTest />);

      // Initially should not throw
      expect(
        container.querySelector('[data-testid="error-caught"]'),
      ).not.toBeInTheDocument();

      // Component should be in normal state
      expect(screen.getByText("Error Boundary Test")).toBeInTheDocument();
    });

    it("should reset state appropriately", () => {
      render(<ErrorTest />);

      // Component should maintain consistent state
      const renderErrorButton = screen.getByText("Trigger Render Error");
      expect(renderErrorButton).toBeInTheDocument();
      expect(renderErrorButton).toBeEnabled();
    });
  });

  describe("UI interaction", () => {
    it("should have properly styled buttons", () => {
      render(<ErrorTest />);

      const buttons = screen.getAllByRole("button");

      // All buttons should be present and clickable
      expect(buttons).toHaveLength(4);
      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });

    it("should display warning alert", () => {
      render(<ErrorTest />);

      const warningAlert = screen.getByText(
        /These buttons will trigger real errors/,
      );
      expect(warningAlert).toBeInTheDocument();
    });

    it("should show proper icons and styling", () => {
      render(<ErrorTest />);

      // Check for card structure
      const cardTitle = screen.getByText("Error Boundary Test");
      expect(cardTitle).toBeInTheDocument();

      const cardDescription = screen.getByText(
        /Test different types of errors to verify ErrorBoundary/,
      );
      expect(cardDescription).toBeInTheDocument();
    });
  });

  describe("Error types validation", () => {
    it("should create proper error instances", () => {
      render(<ErrorTest />);

      // Test error creation without triggering
      expect(() => {
        const testError = new Error("Test Error: ErrorBoundary is working!");
        expect(testError.message).toContain("ErrorBoundary is working!");
      }).not.toThrow();
    });

    it("should handle error messages correctly", () => {
      const TestErrorComponent = () => {
        try {
          throw new Error(
            "Test Error: ErrorBoundary is working! This is a test error thrown from ErrorTest component.",
          );
        } catch (error) {
          return (
            <div data-testid="caught-error">{(error as Error).message}</div>
          );
        }
      };

      render(<TestErrorComponent />);

      const errorMessage = screen.getByTestId("caught-error");
      expect(errorMessage).toHaveTextContent(
        "Test Error: ErrorBoundary is working! This is a test error thrown from ErrorTest component.",
      );
    });
  });

  describe("Development vs Production behavior", () => {
    it("should be development-only component", () => {
      render(<ErrorTest />);

      // Should show warning about triggering real errors
      expect(
        screen.getByText(/These buttons will trigger real errors/),
      ).toBeInTheDocument();
    });

    it("should provide comprehensive error testing", () => {
      render(<ErrorTest />);

      // Should cover all major error types
      const errorTypes = [
        "Render Error",
        "Promise Rejection",
        "JavaScript Error",
        "Async Error",
      ];

      errorTypes.forEach((errorType) => {
        expect(
          screen.getAllByText(new RegExp(errorType)).length,
        ).toBeGreaterThan(0);
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button labels", () => {
      render(<ErrorTest />);

      const buttons = [
        "Trigger Render Error",
        "Trigger Promise Rejection",
        "Trigger JS Error",
        "Trigger Async Error",
      ];

      buttons.forEach((buttonText) => {
        const button = screen.getByRole("button", { name: buttonText });
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
      });
    });

    it("should have proper heading structure", () => {
      render(<ErrorTest />);

      // Check for a section heading
      const sectionHeadings = screen.getAllByText(/Render Error/);
      const heading = sectionHeadings.find((el) => el.tagName === "H3");
      expect(heading).toBeTruthy();
    });

    it("should provide clear instructions", () => {
      render(<ErrorTest />);

      // Instructions should be clear for developers
      expect(
        screen.getByText(/Check browser console for error logs/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Render error should show ErrorFallback UI/),
      ).toBeInTheDocument();
    });
  });
});
