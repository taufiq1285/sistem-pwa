/**
 * ThemeToggle provides a compact control for switching light, dark, and system themes.
 */

import type { ReactElement } from "react";
import {
  IconCheck,
  IconDeviceLaptop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/hooks/useTheme";
import { cn } from "@/lib/utils";
import type { Theme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

interface ThemeOption {
  value: Theme;
  label: string;
  icon: ReactElement;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: <IconSun className="size-4" />,
  },
  {
    value: "dark",
    label: "Dark",
    icon: <IconMoon className="size-4" />,
  },
  {
    value: "system",
    label: "System",
    icon: <IconDeviceLaptop className="size-4" />,
  },
];

export function ThemeToggle({ className }: ThemeToggleProps): ReactElement {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-[34px] w-[34px] rounded-sm border border-border-light bg-surface-0 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary",
            className,
          )}
          aria-label="Ganti tema"
        >
          <IconSun
            className={cn(
              "absolute size-4 transition-opacity duration-200",
              resolvedTheme === "light" ? "opacity-100" : "opacity-0",
            )}
          />
          <IconMoon
            className={cn(
              "absolute size-4 transition-opacity duration-200",
              resolvedTheme === "dark" ? "opacity-100" : "opacity-0",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEME_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="gap-2"
            onClick={() => setTheme(option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
            {theme === option.value ? (
              <IconCheck className="ml-auto size-4 text-role-accent" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
