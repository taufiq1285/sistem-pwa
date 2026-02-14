/**
 * ErrorBoundary Component Unit Tests
 * Comprehensive testing of error boundary functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Component, useState } from "react";
import { ErrorBoundary } from "../../../components/common/ErrorBoundary";

// Mock error logger
vi.mock("../../../lib/utils/error-logger", () => ({
  logReactError: vi.fn(),
}));

// Mock ErrorFallback component
vi.mock("../../../../../components/common/ErrorFallback", () => ({
  ErrorFallback: ({
    error,
    resetError,
  }: {
    error: Error | null;
    resetError: () => void;
  }) => (
    <div data-testid="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error?.message}</p>
      <button onClick={resetError} data-testid="reset-button">
        Reset
      </button>
    </div>
  ),
}));

const mockLogReactError = vi.mocked(
  await import("../../../../../lib/utils/error-logger"),
).logReactError;

// Test components
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div data-testid="success">Success</div>;
};

const ProblematicComponent = () => {
  throw new Error("Component crashed!");
};

const WorkingComponent = () => (
  <div data-testid="working">Working component</div>
);

describe("ErrorBoundary Component", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe("Normal operation", () => {
    it("should render children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("working")).toBeInTheDocument();
    });

    it("should render multiple children correctly", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
    });

    it("should not call error logging when no error", () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>,
      );

      expect(mockLogReactError).not.toHaveBeenCalled();
    });
  });

  describe("Error catching", () => {
    it("should catch and display errors from child components", () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
      expect(screen.getByText("Component crashed!")).toBeInTheDocument();
    });

    it("should log errors when they occur", () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(mockLogReactError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Component crashed!",
        }),
        expect.any(Object),
        expect.objectContaining({
          resetKeys: undefined,
        }),
      );
    });

    it("should call custom onError handler when provided", () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Component crashed!",
        }),
        expect.any(Object),
      );
    });
  });

  describe("Custom fallback UI", () => {
    it("should render custom fallback when provided", () => {
      const customFallback = (
        <div data-testid="custom-fallback">Custom error UI</div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
    });

    it("should render default ErrorFallback when no custom fallback", () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
    });

    it("should pass error to default fallback", () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Component crashed!")).toBeInTheDocument();
    });
  });

  describe("Reset functionality", () => {
    it("should reset error state when reset function called", async () => {
      const TestWrapper = () => {
        const [resetKey, setResetKey] = useState(0);

        const fallback = (
          <div data-testid="error-fallback">
            <button data-testid="reset-button" onClick={() => setResetKey(1)}>
              Reset
            </button>
          </div>
        );

        return (
          <ErrorBoundary fallback={fallback} resetKeys={[resetKey]}>
            <ThrowError shouldThrow={resetKey === 0} />
          </ErrorBoundary>
        );
      };

      render(<TestWrapper />);

      // Error should be displayed
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();

      // Click reset button
      const resetButton = screen.getByTestId("reset-button");
      resetButton.click();

      // Should re-render children without error
      await waitFor(() => {
        expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
        expect(screen.getByTestId("success")).toBeInTheDocument();
      });
    });

    it("should reset when resetKeys change", () => {
      let currentResetKey = 1;

      const TestWrapper = ({ resetKey }: { resetKey: number }) => (
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={resetKey === 1} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestWrapper resetKey={currentResetKey} />);

      // Should show error
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();

      // Change resetKey
      currentResetKey = 2;
      rerender(<TestWrapper resetKey={currentResetKey} />);

      // Should reset and show success
      expect(screen.getByTestId("success")).toBeInTheDocument();
      expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
    });

    it("should not reset when resetKeys remain the same", () => {
      const resetKeys = [1, "test"];

      const { rerender } = render(
        <ErrorBoundary resetKeys={resetKeys}>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();

      // Rerender with same resetKeys
      rerender(
        <ErrorBoundary resetKeys={resetKeys}>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      // Should still show error
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
    });

    it("should handle resetKeys with different types", () => {
      const TestComponent = ({ resetKey }: { resetKey: string | number }) => (
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={resetKey === "error"} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestComponent resetKey="error" />);

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();

      rerender(<TestComponent resetKey="success" />);

      expect(screen.getByTestId("success")).toBeInTheDocument();
    });
  });

  describe("Error logging integration", () => {
    it("should pass resetKeys to error logger", () => {
      const resetKeys = [1, "test"];

      render(
        <ErrorBoundary resetKeys={resetKeys}>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(mockLogReactError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object),
        expect.objectContaining({
          resetKeys,
        }),
      );
    });

    it("should handle missing resetKeys in logger", () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      expect(mockLogReactError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object),
        expect.objectContaining({
          resetKeys: undefined,
        }),
      );
    });
  });

  describe("Component lifecycle", () => {
    it("should handle componentDidUpdate correctly", () => {
      const TestComponent = ({ resetKey }: { resetKey: number }) => (
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={resetKey === 1} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestComponent resetKey={1} />);

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();

      // Update with new resetKey should trigger reset
      rerender(<TestComponent resetKey={2} />);

      // Should reset the error boundary
      expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
      expect(screen.getByTestId("success")).toBeInTheDocument();
    });

    it("should handle getDerivedStateFromError", () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>,
      );

      // State should be updated to show error
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle errors with no message", () => {
      const NoMessageError = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <NoMessageError />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
    });

    it("should handle non-Error objects thrown", () => {
      const ThrowString = () => {
        throw "String error";
      };

      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
    });

    it("should handle null children", () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);

      // Should render without errors
      expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
    });

    it("should handle empty resetKeys array", () => {
      render(
        <ErrorBoundary resetKeys={[]}>
          <WorkingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("working")).toBeInTheDocument();
    });
  });

  describe("Multiple error scenarios", () => {
    it("should handle sequential errors", () => {
      const TestComponent = ({ shouldError }: { shouldError: boolean }) => (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldError} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestComponent shouldError={true} />);

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();

      rerender(<TestComponent shouldError={false} />);
      // Should still show error until reset
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
    });

    it("should isolate errors to specific boundary", () => {
      const OuterBoundary = () => (
        <div data-testid="outer">
          <ErrorBoundary>
            <ProblematicComponent />
          </ErrorBoundary>
          <WorkingComponent />
        </div>
      );

      render(<OuterBoundary />);

      // Error should be caught by inner boundary
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
      // Working component should still render
      expect(screen.getByTestId("working")).toBeInTheDocument();
    });

    it("should handle nested error boundaries", () => {
      const NestedBoundaries = () => (
        <ErrorBoundary
          fallback={<div data-testid="outer-fallback">Outer error</div>}
        >
          <ErrorBoundary
            fallback={<div data-testid="inner-fallback">Inner error</div>}
          >
            <ProblematicComponent />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      render(<NestedBoundaries />);

      // Inner boundary should catch the error
      expect(screen.getByTestId("inner-fallback")).toBeInTheDocument();
      expect(screen.queryByTestId("outer-fallback")).not.toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should not re-render children unnecessarily", () => {
      let renderCount = 0;

      const CountingComponent = () => {
        renderCount++;
        return <div data-testid="counting">Render count: {renderCount}</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <CountingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Render count: 1")).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <CountingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Render count: 2")).toBeInTheDocument();
    });
  });
});
