import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Calendar } from "@/components/shared/Calendar/Calendar";
import { EventDialog } from "@/components/shared/Calendar/EventDialog";

const calendarEvent = {
  id: "evt-1",
  title: "Praktikum Basis Data",
  start: "2025-01-15T08:00:00.000Z",
  end: "2025-01-15T10:00:00.000Z",
  type: "class",
  location: "Lab Komputer 1",
  description: "Materi normalisasi database",
  color: "#2563eb",
  metadata: {
    status: "approved",
    kelas_id: "kelas-12345678",
    laboratorium_id: "lab-12345678",
  },
};

describe("Calendar", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("menampilkan judul bulan dan event pada kalender", () => {
    render(
      <Calendar
        initialDate={new Date("2025-01-15T00:00:00.000Z")}
        events={[calendarEvent as any]}
      />,
    );

    expect(screen.getByText(/januari 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/Praktikum Basis Data/i)).toBeInTheDocument();
  });

  it("memanggil onDateClick saat tanggal dipilih", () => {
    const onDateClick = vi.fn();

    render(
      <Calendar
        initialDate={new Date("2025-01-15T00:00:00.000Z")}
        events={[]}
        onDateClick={onDateClick}
      />,
    );

    fireEvent.click(screen.getByText("15"));
    expect(onDateClick).toHaveBeenCalled();
  });

  it("memanggil onEventClick saat event diklik", () => {
    const onEventClick = vi.fn();

    render(
      <Calendar
        initialDate={new Date("2025-01-15T00:00:00.000Z")}
        events={[calendarEvent as any]}
        onEventClick={onEventClick}
      />,
    );

    fireEvent.click(screen.getByText(/Praktikum Basis Data/i));
    expect(onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: "evt-1" }));
  });
});

describe("EventDialog", () => {
  it("tidak merender jika event null", () => {
    const { container } = render(
      <EventDialog event={null} open onOpenChange={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("menampilkan detail event dan actions", () => {
    render(
      <EventDialog
        event={calendarEvent as any}
        open
        onOpenChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Praktikum Basis Data")).toBeInTheDocument();
    expect(screen.getByText("Lab Komputer 1")).toBeInTheDocument();
    expect(screen.getByText(/Materi normalisasi database/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeInTheDocument();
  });

  it("memanggil handler edit dan delete", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <EventDialog
        event={calendarEvent as any}
        open
        onOpenChange={onOpenChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "evt-1" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "evt-1" }));
  });
});