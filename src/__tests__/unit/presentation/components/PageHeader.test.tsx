/**
 * PageHeader Component Unit Tests
 * Comprehensive testing of page header component
 */

import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageHeader } from "../../../../components/common/PageHeader";
import { Button } from "../../../../components/ui/button";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
const renderWithRouter = (component: ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("PageHeader Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("should render with title only", () => {
      renderWithRouter(<PageHeader title="Test Page" />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Test Page",
      );
    });
    it("should render title with correct styling", () => {
      renderWithRouter(<PageHeader title="Styled Title" />);

      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toHaveClass("text-4xl", "font-extrabold", "tracking-tight");
    });

    it("should apply custom className", () => {
      const { container } = renderWithRouter(<PageHeader title="Title" className="custom-class" />);

      const rootContainer = container.querySelector(".custom-class");
      expect(rootContainer).toBeInTheDocument();
      expect(rootContainer).toHaveClass("custom-class");
    });
  });

  describe("Description", () => {
    it("should render description when provided", () => {
      const description = "This is a page description";
      renderWithRouter(<PageHeader title="Title" description={description} />);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      renderWithRouter(<PageHeader title="Title" />);

      const description = document.querySelector("p");
      expect(description).not.toBeInTheDocument();
    });

    it("should style description correctly", () => {
      renderWithRouter(
        <PageHeader title="Title" description="Test description" />,
      );

      const description = screen.getByText("Test description");
      expect(description).toHaveClass(
        "mt-2",
        "text-lg",
        "font-semibold",
        "max-w-2xl",
      );
    });
  });

  describe("Breadcrumbs", () => {
    it("should render breadcrumbs when provided", () => {
      const breadcrumbs = [
        { label: "Home", href: "/" },
        { label: "Settings", href: "/settings" },
        { label: "Profile" },
      ];

      renderWithRouter(
        <PageHeader title="Profile Settings" breadcrumbs={breadcrumbs} />,
      );

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    it("should not render breadcrumbs when not provided", () => {
      renderWithRouter(<PageHeader title="Title" />);

      const nav = screen.queryByRole("navigation");
      expect(nav).not.toBeInTheDocument();
    });

    it("should not render breadcrumbs when empty array", () => {
      renderWithRouter(<PageHeader title="Title" breadcrumbs={[]} />);

      const nav = screen.queryByRole("navigation");
      expect(nav).not.toBeInTheDocument();
    });

    it("should render breadcrumb separators", () => {
      const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Current" }];

      renderWithRouter(<PageHeader title="Title" breadcrumbs={breadcrumbs} />);

      expect(screen.getByText("/")).toBeInTheDocument();
    });

    it("should handle clickable breadcrumb navigation", () => {
      const breadcrumbs = [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Current" },
      ];

      renderWithRouter(<PageHeader title="Title" breadcrumbs={breadcrumbs} />);

      const dashboardLink = screen.getByRole("button", { name: "Dashboard" });
      fireEvent.click(dashboardLink);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should style current breadcrumb differently", () => {
      const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Current" }];

      renderWithRouter(<PageHeader title="Title" breadcrumbs={breadcrumbs} />);

      const currentBreadcrumb = screen.getByText("Current");
      expect(currentBreadcrumb).toHaveClass("text-foreground", "font-medium");
    });
  });

  describe("Back button", () => {
    it("should render back button when showBack is true", () => {
      /**
       * PageHeader Component Unit Tests
       * Comprehensive testing of page header component
       */
      renderWithRouter(<PageHeader title="Title" showBack={true} />);

      const backButton = screen.getByRole("button", { name: /kembali/i });
      expect(backButton).toBeInTheDocument();
    });

    it("should not render back button by default", () => {
      renderWithRouter(<PageHeader title="Title" />);

      const backButton = screen.queryByRole("button", { name: /kembali/i });
      expect(backButton).not.toBeInTheDocument();
    });

    it("should call custom onBack when provided", () => {
      const mockOnBack = vi.fn();
      renderWithRouter(
        <PageHeader title="Title" showBack={true} onBack={mockOnBack} />,
      );

      const backButton = screen.getByRole("button", { name: /kembali/i });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should use navigate(-1) when no custom onBack", () => {
      renderWithRouter(<PageHeader title="Title" showBack={true} />);

      const backButton = screen.getByRole("button", { name: /kembali/i });
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should have proper accessibility for back button", () => {
      renderWithRouter(<PageHeader title="Title" showBack={true} />);

      const backButton = screen.getByRole("button", { name: /kembali/i });
      expect(backButton).toHaveAttribute("type", "button");
    });
  });

  describe("Actions", () => {
    it("should render action elements when provided", () => {
      const action = <Button data-testid="action-button">Create New</Button>;
      renderWithRouter(<PageHeader title="Title" action={action} />);

      expect(screen.getByTestId("action-button")).toBeInTheDocument();
    });

    it("should not render actions when not provided", () => {
      renderWithRouter(<PageHeader title="Title" />);

      const actionContainer = document.querySelector(
        ".shrink-0.flex.items-center.gap-2",
      );
      expect(actionContainer).not.toBeInTheDocument();
    });

    it("should render multiple action elements", () => {
      const actions = (
        <>
          <Button data-testid="action1">Action 1</Button>
          <Button data-testid="action2">Action 2</Button>
        </>
      );
      renderWithRouter(<PageHeader title="Title" action={actions} />);

      expect(screen.getByTestId("action1")).toBeInTheDocument();
      expect(screen.getByTestId("action2")).toBeInTheDocument();
    });
  });

  describe("Layout structure", () => {
    it("should have proper layout spacing", () => {
      const { container } = renderWithRouter(<PageHeader title="Title" />);

      const rootContainer = container.querySelector(".space-y-4");
      expect(rootContainer).toBeInTheDocument();
      expect(rootContainer).toHaveClass("space-y-4");
    });

    it("should render separator", () => {
      renderWithRouter(<PageHeader title="Title" />);

      const container = screen.getByRole("heading").closest("div");
      expect(container).toBeInTheDocument();
    });

    it("should handle responsive layout", () => {
      renderWithRouter(
        <PageHeader
          title="Responsive Title"
          description="Responsive description"
          showBack={true}
          action={<Button>Action</Button>}
        />,
      );

      const headerContent = document.querySelector(
        ".flex.items-start.justify-between",
      );
      expect(headerContent).toBeInTheDocument();
    });
  });

  describe("Complete scenarios", () => {
    it("should render all elements together", () => {
      const breadcrumbs = [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings" },
      ];
      const action = <Button data-testid="save-button">Save</Button>;

      renderWithRouter(
        <PageHeader
          title="User Settings"
          description="Manage your account preferences"
          breadcrumbs={breadcrumbs}
          showBack={true}
          action={action}
          className="custom-header"
        />,
      );

      expect(screen.getByText("User Settings")).toBeInTheDocument();
      expect(
        screen.getByText("Manage your account preferences"),
      ).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /kembali/i }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
    });

    it("should handle minimal configuration", () => {
      renderWithRouter(<PageHeader title="Simple Page" />);

      expect(screen.getByText("Simple Page")).toBeInTheDocument();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByText(/description/)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      renderWithRouter(<PageHeader title="Main Page Title" />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("should provide navigation context", () => {
      const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Current" }];

      renderWithRouter(<PageHeader title="Title" breadcrumbs={breadcrumbs} />);

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("should have accessible back button", () => {
      renderWithRouter(<PageHeader title="Title" showBack={true} />);

      const backButton = screen.getByRole("button", { name: /kembali/i });
      expect(backButton).toHaveAccessibleName();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty title", () => {
      renderWithRouter(<PageHeader title="" />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("");
    });

    it("should handle very long title", () => {
      const longTitle =
        "This is a very long page title that might need to wrap to multiple lines in certain viewport sizes";
      renderWithRouter(<PageHeader title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle breadcrumbs without href", () => {
      const breadcrumbs = [
        { label: "Non-clickable" },
        { label: "Another non-clickable" },
      ];

      renderWithRouter(<PageHeader title="Title" breadcrumbs={breadcrumbs} />);

      expect(screen.getByText("Non-clickable")).toBeInTheDocument();
      expect(screen.getByText("Another non-clickable")).toBeInTheDocument();
    });

    it("should handle mixed breadcrumb types", () => {
      const breadcrumbs = [
        { label: "Clickable", href: "/clickable" },
        { label: "Non-clickable" },
        { label: "Another clickable", href: "/another" },
        { label: "Final non-clickable" },
      ];

      renderWithRouter(<PageHeader title="Title" breadcrumbs={breadcrumbs} />);

      expect(
        screen.getByRole("button", { name: "Clickable" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Another clickable" }),
      ).toBeInTheDocument();

      expect(screen.getByText("Non-clickable")).toBeInTheDocument();
      expect(screen.getByText("Final non-clickable")).toBeInTheDocument();
    });
  });
});
