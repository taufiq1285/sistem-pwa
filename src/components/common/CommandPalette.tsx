/**
 * CommandPalette provides global quick navigation, role actions, and live search.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactElement,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  IconBell,
  IconBook,
  IconCalendar,
  IconClipboardCheck,
  IconDatabaseSearch,
  IconLogout,
  IconMoonStars,
  IconPackage,
  IconPlus,
  IconSearch,
  IconSettings,
  IconUpload,
  IconUser,
  IconUserPlus,
} from "@tabler/icons-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem as CommandItemPrimitive,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { getNavigationItems } from "@/config/navigation.config";
import { getRoleProfilePath } from "@/config/routes.config";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCommandPalette } from "@/lib/hooks/useCommandPalette";
import { useRole } from "@/lib/hooks/useRole";
import { useTheme } from "@/lib/hooks/useTheme";
import { supabase } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth.types";

interface CommandItem {
  id: string;
  label: string;
  icon: ElementType;
  shortcut?: string;
  onSelect: () => void;
  group: "nav" | "action" | "setting" | "search";
}

interface SearchResult {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: ElementType;
}

interface QuickActionConfig {
  id: string;
  label: string;
  path: string;
  icon: ElementType;
  shortcut?: string;
}

const quickActionsByRole: Record<UserRole, QuickActionConfig[]> = {
  admin: [
    {
      id: "admin-add-user",
      label: "Tambah User",
      path: "/admin/users",
      icon: IconUserPlus,
      shortcut: "U",
    },
    {
      id: "admin-create-announcement",
      label: "Buat Pengumuman",
      path: "/admin/announcements",
      icon: IconBell,
      shortcut: "P",
    },
  ],
  dosen: [
    {
      id: "dosen-create-quiz",
      label: "Buat Kuis",
      path: "/dosen/kuis/create",
      icon: IconPlus,
      shortcut: "K",
    },
    {
      id: "dosen-upload-materi",
      label: "Upload Materi",
      path: "/dosen/materi",
      icon: IconUpload,
      shortcut: "M",
    },
    {
      id: "dosen-absen-kelas",
      label: "Absen Kelas",
      path: "/dosen/kehadiran",
      icon: IconClipboardCheck,
      shortcut: "A",
    },
  ],
  mahasiswa: [
    {
      id: "mahasiswa-sync-offline",
      label: "Sync Offline",
      path: "/mahasiswa/offline-sync",
      icon: IconDatabaseSearch,
      shortcut: "S",
    },
    {
      id: "mahasiswa-view-schedule",
      label: "Lihat Jadwal",
      path: "/mahasiswa/jadwal",
      icon: IconCalendar,
      shortcut: "J",
    },
  ],
  laboran: [
    {
      id: "laboran-approve-borrowing",
      label: "Persetujuan Peminjaman",
      path: "/laboran/persetujuan",
      icon: IconClipboardCheck,
      shortcut: "P",
    },
    {
      id: "laboran-check-inventory",
      label: "Cek Inventaris",
      path: "/laboran/inventaris",
      icon: IconPackage,
      shortcut: "I",
    },
  ],
};

const escapeSupabaseSearch = (value: string): string =>
  value.replace(/[%_,]/g, "");

async function fetchSearchResults(
  query: string,
  role: UserRole,
): Promise<SearchResult[]> {
  const term = escapeSupabaseSearch(query.trim());

  if (!term) {
    return [];
  }

  const results: SearchResult[] = [];

  try {
    if (role === "admin") {
      const [usersResponse, mataKuliahResponse, kelasResponse, labResponse] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, full_name, email, role")
            .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
            .limit(4),
          supabase
            .from("mata_kuliah")
            .select("id, kode_mk, nama_mk")
            .or(`kode_mk.ilike.%${term}%,nama_mk.ilike.%${term}%`)
            .limit(4),
          supabase
            .from("kelas")
            .select("id, kode_kelas, nama_kelas")
            .or(`kode_kelas.ilike.%${term}%,nama_kelas.ilike.%${term}%`)
            .limit(4),
          supabase
            .from("laboratorium")
            .select("id, kode_lab, nama_lab")
            .or(`kode_lab.ilike.%${term}%,nama_lab.ilike.%${term}%`)
            .limit(4),
        ]);

      if (usersResponse.error) throw usersResponse.error;
      if (mataKuliahResponse.error) throw mataKuliahResponse.error;
      if (kelasResponse.error) throw kelasResponse.error;
      if (labResponse.error) throw labResponse.error;

      usersResponse.data?.forEach((user) => {
        results.push({
          id: `search-user-${user.id}`,
          label: user.full_name,
          description: `${user.email} · ${user.role}`,
          path: "/admin/users",
          icon: IconUser,
        });
      });

      mataKuliahResponse.data?.forEach((mataKuliah) => {
        results.push({
          id: `search-mk-${mataKuliah.id}`,
          label: mataKuliah.nama_mk,
          description: mataKuliah.kode_mk,
          path: "/admin/mata-kuliah",
          icon: IconBook,
        });
      });

      kelasResponse.data?.forEach((kelas) => {
        results.push({
          id: `search-kelas-${kelas.id}`,
          label: kelas.nama_kelas,
          description: kelas.kode_kelas,
          path: "/admin/kelas",
          icon: IconUser,
        });
      });

      labResponse.data?.forEach((lab) => {
        results.push({
          id: `search-lab-${lab.id}`,
          label: lab.nama_lab,
          description: lab.kode_lab,
          path: "/admin/laboratories",
          icon: IconDatabaseSearch,
        });
      });
    }

    if (role === "dosen" || role === "mahasiswa") {
      const [kuisResponse, materiResponse] = await Promise.all([
        supabase
          .from("kuis")
          .select("id, judul, status")
          .ilike("judul", `%${term}%`)
          .limit(5),
        supabase
          .from("materi")
          .select("id, judul, tipe_file")
          .ilike("judul", `%${term}%`)
          .limit(5),
      ]);

      if (kuisResponse.error) throw kuisResponse.error;
      if (materiResponse.error) throw materiResponse.error;

      const kuisPath = role === "dosen" ? "/dosen/kuis" : "/mahasiswa/kuis";
      const materiPath =
        role === "dosen" ? "/dosen/materi" : "/mahasiswa/materi";

      kuisResponse.data?.forEach((kuis) => {
        results.push({
          id: `search-kuis-${kuis.id}`,
          label: kuis.judul,
          description: `Kuis · ${kuis.status ?? "draft"}`,
          path: kuisPath,
          icon: IconClipboardCheck,
        });
      });

      materiResponse.data?.forEach((materi) => {
        results.push({
          id: `search-materi-${materi.id}`,
          label: materi.judul,
          description: `Materi · ${materi.tipe_file ?? "file"}`,
          path: materiPath,
          icon: IconBook,
        });
      });
    }

    if (role === "laboran") {
      const [inventarisResponse, labResponse] = await Promise.all([
        supabase
          .from("inventaris")
          .select("id, kode_barang, nama_barang, kategori")
          .or(`kode_barang.ilike.%${term}%,nama_barang.ilike.%${term}%`)
          .limit(6),
        supabase
          .from("laboratorium")
          .select("id, kode_lab, nama_lab")
          .or(`kode_lab.ilike.%${term}%,nama_lab.ilike.%${term}%`)
          .limit(4),
      ]);

      if (inventarisResponse.error) throw inventarisResponse.error;
      if (labResponse.error) throw labResponse.error;

      inventarisResponse.data?.forEach((item) => {
        results.push({
          id: `search-inventaris-${item.id}`,
          label: item.nama_barang,
          description: `${item.kode_barang} · ${item.kategori ?? "Inventaris"}`,
          path: "/laboran/inventaris",
          icon: IconPackage,
        });
      });

      labResponse.data?.forEach((lab) => {
        results.push({
          id: `search-laboran-lab-${lab.id}`,
          label: lab.nama_lab,
          description: lab.kode_lab,
          path: "/laboran/laboratorium",
          icon: IconDatabaseSearch,
        });
      });
    }

    return results.slice(0, 10);
  } catch (error: unknown) {
    console.error("Command palette search failed:", error);
    return [];
  }
}

export function CommandPalette(): ReactElement | null {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { role } = useRole();
  const { isOpen, close } = useCommandPalette();
  const { resolvedTheme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    let isCancelled = false;

    const runSearch = async (): Promise<void> => {
      if (!role || !debouncedSearch.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await fetchSearchResults(debouncedSearch, role);

        if (!isCancelled) {
          setSearchResults(results);
        }
      } catch (error: unknown) {
        console.error("Command palette search effect failed:", error);
        if (!isCancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    };

    void runSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, role]);

  const handleNavigate = useCallback(
    (path: string): void => {
      close();
      setSearch("");
      navigate(path);
    },
    [close, navigate],
  );

  const handleLogout = useCallback((): void => {
    const runLogout = async (): Promise<void> => {
      try {
        close();
        setSearch("");
        await logout();
        navigate("/login");
      } catch (error: unknown) {
        console.error("Command palette logout failed:", error);
      }
    };

    void runLogout();
  }, [close, logout, navigate]);

  const navItems = useMemo<CommandItem[]>(() => {
    if (!role) {
      return [];
    }

    return getNavigationItems(role).map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      icon: item.icon,
      onSelect: () => handleNavigate(item.href),
      group: "nav",
    }));
  }, [handleNavigate, role]);

  const actionItems = useMemo<CommandItem[]>(() => {
    if (!role) {
      return [];
    }

    return quickActionsByRole[role].map((action) => ({
      id: `action-${action.id}`,
      label: action.label,
      icon: action.icon,
      shortcut: action.shortcut,
      onSelect: () => handleNavigate(action.path),
      group: "action",
    }));
  }, [handleNavigate, role]);

  const settingItems = useMemo<CommandItem[]>(() => {
    if (!role) {
      return [];
    }

    return [
      {
        id: "setting-profile",
        label: "Profil",
        icon: IconUser,
        shortcut: "P",
        onSelect: () => handleNavigate(getRoleProfilePath(role)),
        group: "setting",
      },
      {
        id: "setting-theme",
        label: "Ganti Tema",
        icon: resolvedTheme === "dark" ? IconMoonStars : IconSettings,
        shortcut: "T",
        onSelect: () => {
          close();
          setSearch("");
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
        },
        group: "setting",
      },
      {
        id: "setting-logout",
        label: "Logout",
        icon: IconLogout,
        shortcut: "Esc",
        onSelect: handleLogout,
        group: "setting",
      },
    ];
  }, [close, handleLogout, handleNavigate, resolvedTheme, role, setTheme]);

  const searchItems = useMemo<CommandItem[]>(
    () =>
      searchResults.map((result) => ({
        id: result.id,
        label: result.label,
        icon: result.icon,
        shortcut: "Buka",
        onSelect: () => handleNavigate(result.path),
        group: "search",
      })),
    [handleNavigate, searchResults],
  );

  const renderCommandItem = (item: CommandItem): ReactElement => {
    const Icon = item.icon;

    return (
      <CommandItemPrimitive
        key={item.id}
        value={`${item.group}-${item.label}-${item.id}`}
        onSelect={item.onSelect}
      >
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
        {item.shortcut ? (
          <CommandShortcut>{item.shortcut}</CommandShortcut>
        ) : null}
      </CommandItemPrimitive>
    );
  };

  if (!isOpen || !role) {
    return null;
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close();
          setSearch("");
        }
      }}
      title="Command Palette"
      description="Cari navigasi, aksi cepat, pengaturan, dan data aplikasi."
      className="max-w-2xl border-border bg-popover shadow-2xl"
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Cari halaman, aksi, atau data..."
      />
      <CommandList className="max-h-[min(70vh,520px)]">
        <CommandEmpty>
          {isSearching ? "Mencari data..." : "Tidak ada hasil."}
        </CommandEmpty>

        <CommandGroup heading="Navigasi">
          {navItems.map(renderCommandItem)}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Aksi Cepat">
          {actionItems.map(renderCommandItem)}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pengaturan">
          {settingItems.map(renderCommandItem)}
        </CommandGroup>

        {search.trim() ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Hasil Pencarian">
              {searchItems.length > 0 ? (
                searchItems.map(renderCommandItem)
              ) : (
                <CommandItemPrimitive disabled>
                  <IconSearch aria-hidden="true" />
                  <span>
                    {isSearching ? "Mencari data..." : "Belum ada hasil data"}
                  </span>
                </CommandItemPrimitive>
              )}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
