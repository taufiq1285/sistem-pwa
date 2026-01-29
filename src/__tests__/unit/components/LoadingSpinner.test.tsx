/**
 * LoadingSpinner Component Unit Tests
 * Comprehensive testing of loading indicator component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";

describe("LoadingSpinner Component", () => {
  describe("Basic rendering", () => {
    it("should render loading spinner with default props", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("presentation", { hidden: true });
      expect(spinner).toBeInTheDocument();
    });

    it("should render with loading text when provided", () => {
      const loadingText = "Loading data...";
      render(<LoadingSpinner text={loadingText} />);

      expect(screen.getByText(loadingText)).toBeInTheDocument();
    });

    it("should render without text when not provided", () => {
      render(<LoadingSpinner />);

      // No text should be present
      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container?.querySelector("p")).not.toBeInTheDocument();
    });
  });

  describe("Size variants", () => {
    it("should render small size spinner", () => {
      render(<LoadingSpinner size="sm" text="Small spinner" />);

      const text = screen.getByText("Small spinner");
      expect(text).toHaveClass("text-sm");
    });

    it("should render medium size spinner (default)", () => {
      render(<LoadingSpinner size="md" text="Medium spinner" />);

      const text = screen.getByText("Medium spinner");
      expect(text).toHaveClass("text-base");
    });

    it("should render large size spinner", () => {
      render(<LoadingSpinner size="lg" text="Large spinner" />);

      const text = screen.getByText("Large spinner");
      expect(text).toHaveClass("text-lg");
    });

    it("should render extra large size spinner", () => {
      render(<LoadingSpinner size="xl" text="XL spinner" />);

      const text = screen.getByText("XL spinner");
      expect(text).toHaveClass("text-xl");
    });

    it("should use medium size by default when size not specified", () => {
      render(<LoadingSpinner text="Default size" />);

      const text = screen.getByText("Default size");
      expect(text).toHaveClass("text-base");
    });
  });

  describe("Custom styling", () => {
    it("should apply custom className", () => {
      const customClass = "custom-spinner-class";
      render(<LoadingSpinner className={customClass} />);

      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container).toHaveClass(customClass);
    });

    it("should combine custom className with default classes", () => {
      render(<LoadingSpinner className="my-custom-class" />);

      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container).toHaveClass(
        "flex",
        "flex-col",
        "items-center",
        "my-custom-class",
      );
    });
  });

  describe("Full screen mode", () => {
    it("should render in normal mode by default", () => {
      render(<LoadingSpinner />);

      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container).not.toHaveClass("fixed", "inset-0");
    });

    it("should render in full screen mode when enabled", () => {
      render(<LoadingSpinner fullScreen={true} />);

      const overlay = document.querySelector(".fixed.inset-0");
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass(
        "fixed",
        "inset-0",
        "z-50",
        "flex",
        "items-center",
        "justify-center",
      );
    });

    it("should show backdrop blur in full screen mode", () => {
      render(<LoadingSpinner fullScreen={true} text="Full screen loading" />);

      const overlay = document.querySelector(".fixed.inset-0");
      expect(overlay).toHaveClass("bg-background/80", "backdrop-blur-sm");
    });

    it("should render spinner inside full screen overlay", () => {
      render(<LoadingSpinner fullScreen={true} text="Loading in overlay" />);

      const text = screen.getByText("Loading in overlay");
      expect(text).toBeInTheDocument();

      const overlay = document.querySelector(".fixed.inset-0");
      expect(overlay).toContainElement(text);
    });
  });

  describe("Animation behavior", () => {
    it("should have spinning animation", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("presentation", { hidden: true });
      expect(spinner).toHaveClass("animate-spin");
    });

    it("should maintain animation in all sizes", () => {
      const sizes: Array<"sm" | "md" | "lg" | "xl"> = ["sm", "md", "lg", "xl"];

      sizes.forEach((size) => {
        const { unmount } = render(<LoadingSpinner size={size} />);

        const spinner = screen.getByRole("presentation", { hidden: true });
        expect(spinner).toHaveClass("animate-spin");

        unmount();
      });
    });

    it("should maintain animation in full screen mode", () => {
      render(<LoadingSpinner fullScreen={true} />);

      const spinner = screen.getByRole("presentation", { hidden: true });
      expect(spinner).toHaveClass("animate-spin");
    });
  });

  describe("Icon styling", () => {
    it("should apply primary color to spinner icon", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("presentation", { hidden: true });
      expect(spinner).toHaveClass("text-primary");
    });

    it("should apply correct size classes", () => {
      const testCases = [
        { size: "sm" as const, expectedClass: "h-4 w-4" },
        { size: "md" as const, expectedClass: "h-6 w-6" },
        { size: "lg" as const, expectedClass: "h-8 w-8" },
        { size: "xl" as const, expectedClass: "h-12 w-12" },
      ];

      testCases.forEach(({ size, expectedClass }) => {
        const { unmount } = render(<LoadingSpinner size={size} />);

        const spinner = screen.getByRole("presentation", { hidden: true });
        expect(spinner).toHaveClass(expectedClass);

        unmount();
      });
    });
  });

  describe("Text styling", () => {
    it("should apply muted foreground color to text", () => {
      render(<LoadingSpinner text="Loading text" />);

      const text = screen.getByText("Loading text");
      expect(text).toHaveClass("text-muted-foreground");
    });

    it("should apply correct text size for each spinner size", () => {
      const testCases = [
        { size: "sm" as const, text: "Small", expectedClass: "text-sm" },
        { size: "md" as const, text: "Medium", expectedClass: "text-base" },
        { size: "lg" as const, text: "Large", expectedClass: "text-lg" },
        { size: "xl" as const, text: "Extra Large", expectedClass: "text-xl" },
      ];

      testCases.forEach(({ size, text, expectedClass }) => {
        const { unmount } = render(<LoadingSpinner size={size} text={text} />);

        const textElement = screen.getByText(text);
        expect(textElement).toHaveClass(expectedClass);

        unmount();
      });
    });

    it("should render text as paragraph element", () => {
      render(<LoadingSpinner text="Loading paragraph" />);

      const text = screen.getByText("Loading paragraph");
      expect(text.tagName).toBe("P");
    });
  });

  describe("Layout structure", () => {
    it("should use flexbox layout", () => {
      render(<LoadingSpinner text="Flex test" />);

      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container).toHaveClass(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
      );
    });

    it("should have gap between spinner and text", () => {
      render(<LoadingSpinner text="Gap test" />);

      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container).toHaveClass("gap-3");
    });

    it("should maintain structure in full screen mode", () => {
      render(<LoadingSpinner fullScreen={true} text="Structure test" />);

      const overlay = document.querySelector(".fixed.inset-0");
      expect(overlay).toHaveClass("flex", "items-center", "justify-center");
    });
  });

  describe("Accessibility", () => {
    it("should be properly labeled for screen readers", () => {
      render(<LoadingSpinner text="Accessible loading" />);

      // Lucide icons typically have presentation role
      const spinner = screen.getByRole("presentation", { hidden: true });
      expect(spinner).toBeInTheDocument();
    });

    it("should provide context through text", () => {
      const loadingMessage = "Loading user data, please wait...";
      render(<LoadingSpinner text={loadingMessage} />);

      const text = screen.getByText(loadingMessage);
      expect(text).toBeInTheDocument();
    });

    it("should be keyboard accessible (no interactive elements)", () => {
      render(<LoadingSpinner text="Non-interactive" />);

      // Spinner should not be focusable
      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container).not.toHaveAttribute("tabindex");
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle data loading scenario", () => {
      render(<LoadingSpinner size="md" text="Loading your dashboard..." />);

      expect(screen.getByText("Loading your dashboard...")).toBeInTheDocument();
      expect(screen.getByRole("presentation", { hidden: true })).toHaveClass(
        "animate-spin",
      );
    });

    it("should handle form submission scenario", () => {
      render(<LoadingSpinner size="sm" text="Saving changes..." />);

      const text = screen.getByText("Saving changes...");
      expect(text).toHaveClass("text-sm");
    });

    it("should handle page loading scenario", () => {
      render(
        <LoadingSpinner
          fullScreen={true}
          size="lg"
          text="Initializing application..."
        />,
      );

      expect(document.querySelector(".fixed.inset-0")).toBeInTheDocument();
      expect(screen.getByText("Initializing application...")).toHaveClass(
        "text-lg",
      );
    });

    it("should handle silent loading (no text)", () => {
      render(<LoadingSpinner size="sm" />);

      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container?.querySelector("p")).not.toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty text string", () => {
      render(<LoadingSpinner text="" />);

      // Empty text should not render paragraph element
      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container?.querySelector("p")).not.toBeInTheDocument();
    });

    it("should handle very long text", () => {
      const longText =
        "This is a very long loading message that might wrap to multiple lines and should still be handled gracefully by the component";
      render(<LoadingSpinner text={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("should handle special characters in text", () => {
      const specialText = "Loading... 123 @#$%^&*()";
      render(<LoadingSpinner text={specialText} />);

      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it("should handle multiple className values", () => {
      render(<LoadingSpinner className="class1 class2 class3" />);

      const container = screen
        .getByRole("presentation", { hidden: true })
        .closest("div");
      expect(container).toHaveClass("class1", "class2", "class3");
    });
  });
});
