/**
 * StatusBadge Component Unit Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/common/StatusBadge";

describe("StatusBadge", () => {
  describe("status label", () => {
    it("menampilkan label 'Menunggu Approval' untuk status pending", () => {
      render(<StatusBadge status="pending" />);
      expect(screen.getByText("Menunggu Approval")).toBeInTheDocument();
    });

    it("menampilkan label 'Approved' untuk status approved", () => {
      render(<StatusBadge status="approved" />);
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });

    it("menampilkan label 'Ditolak' untuk status rejected", () => {
      render(<StatusBadge status="rejected" />);
      expect(screen.getByText("Ditolak")).toBeInTheDocument();
    });

    it("menampilkan label 'Dibatalkan' untuk status cancelled", () => {
      render(<StatusBadge status="cancelled" />);
      expect(screen.getByText("Dibatalkan")).toBeInTheDocument();
    });
  });

  describe("warna per status", () => {
    it("status pending menggunakan warna kuning", () => {
      const { container } = render(<StatusBadge status="pending" />);
      expect(container.firstChild).toHaveClass("bg-yellow-100");
    });

    it("status approved menggunakan warna hijau", () => {
      const { container } = render(<StatusBadge status="approved" />);
      expect(container.firstChild).toHaveClass("bg-green-100");
    });

    it("status rejected menggunakan warna merah", () => {
      const { container } = render(<StatusBadge status="rejected" />);
      expect(container.firstChild).toHaveClass("bg-red-100");
    });

    it("status cancelled menggunakan warna abu-abu", () => {
      const { container } = render(<StatusBadge status="cancelled" />);
      expect(container.firstChild).toHaveClass("bg-gray-100");
    });
  });

  describe("ukuran", () => {
    it("default size sm", () => {
      const { container } = render(<StatusBadge status="pending" />);
      expect(container.firstChild).toHaveClass("text-xs");
    });

    it("size md", () => {
      const { container } = render(<StatusBadge status="pending" size="md" />);
      expect(container.firstChild).toHaveClass("text-sm");
    });

    it("size lg", () => {
      const { container } = render(<StatusBadge status="pending" size="lg" />);
      expect(container.firstChild).toHaveClass("text-base");
    });
  });

  describe("icon", () => {
    it("menampilkan icon secara default (showIcon=true)", () => {
      const { container } = render(<StatusBadge status="pending" />);
      // icon adalah SVG dari lucide-react
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("tidak menampilkan icon saat showIcon=false", () => {
      const { container } = render(
        <StatusBadge status="pending" showIcon={false} />,
      );
      expect(container.querySelector("svg")).not.toBeInTheDocument();
    });
  });
});
