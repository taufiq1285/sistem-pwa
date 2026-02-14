/**
 * EmptyState Component Unit Tests
 * Comprehensive testing of empty state display component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Search, Plus, AlertCircle } from "lucide-react";
import { EmptyState } from "../../../../components/common/EmptyState";

describe.sequential("EmptyState Component", () => {
  const mockAction = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("should render with title only", () => {
      render(<EmptyState title="No data available" />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should render title as heading", () => {
      render(<EmptyState title="Test Title" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Test Title");
    });

    it("should apply custom className", () => {
      render(<EmptyState title="Test" className="custom-class" />);

      const container = screen.getByText("Test").closest("div");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("Description rendering", () => {
    it("should render description when provided", () => {
      const description = "This is a detailed description of the empty state.";
      render(<EmptyState title="Title" description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      render(<EmptyState title="Title" />);

      const descriptionElement = document.querySelector("p");
      expect(descriptionElement).not.toBeInTheDocument();
    });

    it("should render description as paragraph", () => {
      render(<EmptyState title="Title" description="Test description" />);

      const paragraph = screen.getByText("Test description");
      expect(paragraph.tagName).toBe("P");
    });
  });

  describe("Icon rendering", () => {
    it("should render icon when provided", () => {
      render(<EmptyState title="Search Results" icon={Search} />);

      // Check for icon container
      const iconContainer = document.querySelector(".rounded-full.bg-muted");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should not render icon when not provided", () => {
      render(<EmptyState title="No Icon" />);

      const iconContainer = document.querySelector(".rounded-full.bg-muted");
      expect(iconContainer).not.toBeInTheDocument();
    });

    it("should render different icon types", () => {
      const { rerender } = render(<EmptyState title="Test" icon={Search} />);

      let iconContainer = document.querySelector(".rounded-full.bg-muted");
      expect(iconContainer).toBeInTheDocument();

      rerender(<EmptyState title="Test" icon={Plus} />);
      iconContainer = document.querySelector(".rounded-full.bg-muted");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should apply correct icon styling", () => {
      render(<EmptyState title="Test" icon={AlertCircle} />);

      const iconContainer = document.querySelector(".rounded-full.bg-muted");
      expect(iconContainer).toHaveClass(
        "mb-4",
        "flex",
        "h-20",
        "w-20",
        "items-center",
        "justify-center",
      );
    });
  });

  describe("Action button", () => {
    it("should render action button when provided", () => {
      const action = { label: "Create New", onClick: mockAction };
      render(<EmptyState title="No Items" action={action} />);

      expect(
        screen.getByRole("button", { name: "Create New" }),
      ).toBeInTheDocument();
    });

    it("should not render action button when not provided", () => {
      render(<EmptyState title="No Items" />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should call onClick when action button clicked", () => {
      const action = { label: "Add Item", onClick: mockAction };
      render(<EmptyState title="Empty" action={action} />);

      const button = screen.getByRole("button", { name: "Add Item" });
      fireEvent.click(button);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple clicks", () => {
      const action = { label: "Reload", onClick: mockAction };
      render(<EmptyState title="Failed to load" action={action} />);

      const button = screen.getByRole("button", { name: "Reload" });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockAction).toHaveBeenCalledTimes(3);
    });
  });

  describe("Layout and styling", () => {
    it("should have correct container layout classes", () => {
      render(<EmptyState title="Test" />);

      const container = screen.getByText("Test").closest("div");
      expect(container).toHaveClass(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "py-12",
        "text-center",
      );
    });

    it("should style title correctly", () => {
      render(<EmptyState title="Styled Title" />);

      const title = screen.getByText("Styled Title");
      expect(title).toHaveClass("mb-2", "text-lg", "font-semibold");
    });

    it("should style description correctly", () => {
      render(<EmptyState title="Title" description="Styled description" />);

      const description = screen.getByText("Styled description");
      expect(description).toHaveClass(
        "mb-6",
        "text-sm",
        "text-muted-foreground",
        "max-w-md",
      );
    });

    it("should combine custom and default classes", () => {
      render(
        <EmptyState title="Test" className="my-custom-class bg-blue-100" />,
      );

      const container = screen.getByText("Test").closest("div");
      expect(container).toHaveClass(
        "flex",
        "flex-col",
        "my-custom-class",
        "bg-blue-100",
      );
    });
  });

  describe("Complete component scenarios", () => {
    it("should render all elements together", () => {
      const action = { label: "Get Started", onClick: mockAction };

      render(
        <EmptyState
          title="Welcome!"
          description="Start your journey by creating your first item."
          icon={Plus}
          action={action}
        />,
      );

      expect(screen.getByText("Welcome!")).toBeInTheDocument();
      expect(
        screen.getByText("Start your journey by creating your first item."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Get Started" }),
      ).toBeInTheDocument();
      expect(
        document.querySelector(".rounded-full.bg-muted"),
      ).toBeInTheDocument();
    });

    it("should handle minimal configuration", () => {
      render(<EmptyState title="Empty" />);

      expect(screen.getByText("Empty")).toBeInTheDocument();
      expect(screen.queryByText(/description/)).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(document.querySelector(".rounded-full")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<EmptyState title="Accessible Title" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Accessible Title");
    });

    it("should have accessible button when action provided", () => {
      const action = { label: "Accessible Action", onClick: mockAction };
      render(<EmptyState title="Title" action={action} />);

      const button = screen.getByRole("button", { name: "Accessible Action" });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute("disabled");
    });

    it("should provide good text hierarchy", () => {
      render(
        <EmptyState
          title="Main Message"
          description="Supporting details about the empty state"
        />,
      );

      const title = screen.getByRole("heading");
      const description = screen.getByText(
        "Supporting details about the empty state",
      );

      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  describe("Real-world use cases", () => {
    it("should handle search results scenario", () => {
      const action = { label: "Clear Search", onClick: mockAction };

      render(
        <EmptyState
          title="No search results"
          description="We couldn't find any items matching your search."
          icon={Search}
          action={action}
        />,
      );

      expect(screen.getByText("No search results")).toBeInTheDocument();
      expect(screen.getByText(/couldn't find any items/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Clear Search" }),
      ).toBeInTheDocument();
    });

    it("should handle new user onboarding", () => {
      const action = { label: "Create Your First Post", onClick: mockAction };

      render(
        <EmptyState
          title="Welcome to your dashboard!"
          description="Get started by creating your first post."
          icon={Plus}
          action={action}
        />,
      );

      expect(
        screen.getByText("Welcome to your dashboard!"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Your First Post" }),
      ).toBeInTheDocument();
    });

    it("should handle error state scenario", () => {
      const action = { label: "Try Again", onClick: mockAction };

      render(
        <EmptyState
          title="Something went wrong"
          description="We encountered an error while loading your data."
          icon={AlertCircle}
          action={action}
        />,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText(/encountered an error/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try Again" }),
      ).toBeInTheDocument();
    });

    it("should handle simple message scenario", () => {
      render(
        <EmptyState
          title="All caught up!"
          description="You've read all your notifications."
        />,
      );

      expect(screen.getByText("All caught up!")).toBeInTheDocument();
      expect(
        screen.getByText("You've read all your notifications."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty title", () => {
      render(<EmptyState title="" />);

      const heading = screen.getByRole("heading");
      expect(heading).toHaveTextContent("");
    });

    it("should handle very long title", () => {
      const longTitle =
        "This is a very long title that might wrap to multiple lines and should still be displayed correctly without breaking the layout";

      render(<EmptyState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle very long description", () => {
      const longDescription =
        "This is a very long description that contains a lot of text and should wrap appropriately within the max-width constraints while maintaining good readability and proper spacing between elements in the empty state component.";

      render(<EmptyState title="Title" description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it("should handle action with empty label", () => {
      const action = { label: "", onClick: mockAction };

      render(<EmptyState title="Title" action={action} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("");
    });
  });
});
