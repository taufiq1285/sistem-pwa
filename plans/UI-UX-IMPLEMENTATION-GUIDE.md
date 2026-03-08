# Panduan Implementasi UI/UX - Contoh Kode Lengkap

Dokumen ini berisi contoh implementasi kode lengkap untuk komponen-komponen UI yang direkomendasikan dalam analisis UI/UX.

---

## 📁 Struktur File yang Perlu Dibuat

```
src/
├── components/ui/
│   ├── glass-card.tsx          # Glassmorphism card
│   ├── animated-counter.tsx    # Animated number counter
│   ├── status-badge.tsx        # Status badge with pulse
│   ├── stepper.tsx            # Progress stepper
│   ├── dashboard-card.tsx      # Dashboard stat card
│   ├── dashboard-skeleton.tsx  # Loading skeleton
│   └── button-enhanced.tsx     # Enhanced button
├── lib/
│   ├── hooks/
│   │   └── use-animation.ts    # Animation hooks
│   └── toast-config.ts         # Toast configuration
└── styles/
    └── theme-variables.css     # Custom theme variables
```

---

## 1. Glass Card Component

**File:** `src/components/ui/glass-card.tsx`

```tsx
/**
 * Glass Card Component
 * Modern glassmorphism card with backdrop blur effect
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.ComponentProps<"div"> {
  intensity?: "low" | "medium" | "high";
  hover?: boolean;
  border?: boolean;
}

const intensityStyles = {
  low: "bg-white/40 dark:bg-white/10 backdrop-blur-sm",
  medium: "bg-white/60 dark:bg-white/20 backdrop-blur-md",
  high: "bg-white/80 dark:bg-white/30 backdrop-blur-xl",
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, intensity = "medium", hover = true, border = true, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl shadow-lg",
          intensityStyles[intensity],
          border && "border border-white/20 dark:border-white/10",
          hover &&
            "transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
export type { GlassCardProps };
```

**Usage Example:**

```tsx
import { GlassCard } from "@/components/ui/glass-card";

// Basic usage
<GlassCard className="p-6">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-muted-foreground">Card content here</p>
</GlassCard>

// High intensity with no hover
<GlassCard intensity="high" hover={false} className="p-8">
  <p>Static glass card</p>
</GlassCard>
```

---

## 2. Animated Counter

**File:** `src/components/ui/animated-counter.tsx`

```tsx
/**
 * Animated Counter Component
 * Smoothly animates number counting with easing
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
```

**Usage Example:**

```tsx
import { AnimatedCounter } from "@/components/ui/animated-counter";

// Basic usage
<AnimatedCounter value={1234} />

// With formatting
<AnimatedCounter
  value={1500}
  prefix="Rp "
  suffix=",00"
  className="text-3xl font-bold"
/>

// Slow animation
<AnimatedCounter value={999} duration={2000} />
```

---

## 3. Status Badge

**File:** `src/components/ui/status-badge.tsx`

```tsx
/**
 * Status Badge Component
 * Badge with animated pulse indicator for status
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

type StatusType =
  | "online"
  | "offline"
  | "busy"
  | "away"
  | "success"
  | "warning"
  | "error"
  | "info";

interface StatusBadgeProps extends React.ComponentProps<typeof Badge> {
  status: StatusType;
  pulse?: boolean;
}

const statusConfig: Record<
  StatusType,
  { color: string; label: string; pulseColor: string }
> = {
  online: {
    color: "bg-green-500",
    label: "Online",
    pulseColor: "bg-green-400",
  },
  offline: {
    color: "bg-gray-400",
    label: "Offline",
    pulseColor: "bg-gray-300",
  },
  busy: { color: "bg-red-500", label: "Busy", pulseColor: "bg-red-400" },
  away: {
    color: "bg-yellow-500",
    label: "Away",
    pulseColor: "bg-yellow-400",
  },
  success: {
    color: "bg-green-500",
    label: "Success",
    pulseColor: "bg-green-400",
  },
  warning: {
    color: "bg-yellow-500",
    label: "Warning",
    pulseColor: "bg-yellow-400",
  },
  error: { color: "bg-red-500", label: "Error", pulseColor: "bg-red-400" },
  info: { color: "bg-blue-500", label: "Info", pulseColor: "bg-blue-400" },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, pulse = true, className, children, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn("relative pl-6", className)}
        {...props}
      >
        <span className="absolute left-2 flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                config.pulseColor,
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              config.color,
            )}
          />
        </span>
        {children || config.label}
      </Badge>
    );
  },
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, type StatusType };
```

**Usage Example:**

```tsx
import { StatusBadge } from "@/components/ui/status-badge";

// Basic status
<StatusBadge status="online" />
<StatusBadge status="offline" />
<StatusBadge status="success" />

// Custom label
<StatusBadge status="warning">Perhatian</StatusBadge>

// No pulse animation
<StatusBadge status="info" pulse={false} />
```

---

## 4. Stepper Component

**File:** `src/components/ui/stepper.tsx`

```tsx
/**
 * Stepper Component
 * Progress stepper for multi-step forms
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isPending &&
                      "bg-muted text-muted-foreground border-2 border-muted",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted && "text-green-600",
                      isCurrent && "text-primary",
                      isPending && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-all duration-500",
                    index < currentStep ? "bg-green-500" : "bg-muted",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
```

**Usage Example:**

```tsx
import { Stepper } from "@/components/ui/stepper";

const steps = [
  { id: "1", label: "Data Diri", description: "Informasi pribadi" },
  { id: "2", label: "Akademik", description: "Data akademik" },
  { id: "3", label: "Konfirmasi", description: "Verifikasi data" },
  { id: "4", label: "Selesai", description: "Pendaftaran berhasil" },
];

// Current step 2 (index 1)
<Stepper steps={steps} currentStep={1} className="mb-8" />
```

---

## 5. Dashboard Card

**File:** `src/components/ui/dashboard-card.tsx`

```tsx
/**
 * Dashboard Card Component
 * Stat card with animated counter and trend indicator
 */

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "amber" | "purple" | "red";
  className?: string;
}

const colorStyles = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    icon: "text-blue-500",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    icon: "text-green-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    icon: "text-amber-500",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    icon: "text-purple-500",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-600",
    icon: "text-red-500",
  },
};

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  className,
}: DashboardCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <AnimatedCounter
                value={value}
                className="text-3xl font-bold tracking-tight"
              />
              {trend && (
                <div
                  className={cn(
                    "flex items-center text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600",
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
              styles.bg,
            )}
          >
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Usage Example:**

```tsx
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Users, BookOpen, Calendar, Award } from "lucide-react";

<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <DashboardCard
    title="Total Mahasiswa"
    value={1234}
    icon={Users}
    color="blue"
    trend={{ value: 12, isPositive: true }}
  />
  <DashboardCard
    title="Mata Kuliah"
    value={42}
    icon={BookOpen}
    color="green"
  />
  <DashboardCard
    title="Jadwal Aktif"
    value={18}
    icon={Calendar}
    color="amber"
    trend={{ value: 5, isPositive: false }}
  />
  <DashboardCard
    title="Nilai Rata-rata"
    value={85}
    icon={Award}
    color="purple"
  />
</div>
```

---

## 6. Dashboard Skeleton

**File:** `src/components/ui/dashboard-skeleton.tsx`

```tsx
/**
 * Dashboard Skeleton Component
 * Loading state for dashboard with shimmer effect
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-75ll" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Usage Example:**

```tsx
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

function DashboardPage() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <DashboardContent data={data} />;
}
```

---

## 7. Enhanced Button

**File:** `src/components/ui/button-enhanced.tsx`

```tsx
/**
 * Enhanced Button Component
 * Button with loading state and additional variants
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const ButtonEnhanced = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading && loadingText ? loadingText : children}
      </Comp>
    );
  },
);
ButtonEnhanced.displayName = "ButtonEnhanced";

export { ButtonEnhanced, buttonVariants };
```

**Usage Example:**

```tsx
import { ButtonEnhanced } from "@/components/ui/button-enhanced";

// Loading state
<ButtonEnhanced loading>Loading...</ButtonEnhanced>

// Loading with custom text
<ButtonEnhanced loading loadingText="Menyimpan...">
  Simpan
</ButtonEnhanced>

// Gradient variant
<ButtonEnhanced variant="gradient">Premium Action</ButtonEnhanced>

// With icon
<ButtonEnhanced>
  <Save className="mr-2 h-4 w-4" />
  Simpan
</ButtonEnhanced>
```

---

## 8. Animation Hooks

**File:** `src/lib/hooks/use-animation.ts`

```tsx
/**
 * Animation Hooks
 * Custom hooks for scroll and intersection animations
 */

import { useEffect, useRef, useState } from "react";

interface UseIntersectionAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionAnimation({
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
}: UseIntersectionAnimationOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

// Hook for staggered children animation
export function useStaggerAnimation(
  itemCount: number,
  baseDelay: number = 100,
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems((prev) => new Set([...prev, i]));
      }, i * baseDelay);
      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [itemCount, baseDelay]);

  return { visibleItems };
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
```

**Usage Example:**

```tsx
import {
  useIntersectionAnimation,
  useStaggerAnimation,
  useReducedMotion,
} from "@/lib/hooks/use-animation";
import { cn } from "@/lib/utils";

// Fade in on scroll
function FadeInSection({ children }) {
  const { ref, isVisible } = useIntersectionAnimation();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      {children}
    </div>
  );
}

// Staggered list
function StaggeredList({ items }) {
  const { visibleItems } = useStaggerAnimation(items.length);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "transition-all duration-500",
            visibleItems.has(index)
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-4",
          )}
          style={{ transitionDelay: `${index * 100}ms` }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}

// Respect reduced motion
function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "transition-transform",
        !prefersReducedMotion && "hover:scale-105",
      )}
    >
      Content
    </div>
  );
}
```

---

## 9. Toast Configuration

**File:** `src/lib/toast-config.ts`

```tsx
/**
 * Toast Configuration
 * Pre-configured toast notifications with consistent styling
 */

import { toast } from "sonner";

export const toastConfig = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
      icon: "✅",
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
      icon: "❌",
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
      icon: "⚠️",
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
      icon: "ℹ️",
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      duration: Infinity,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  // Custom toast with action
  action: (
    message: string,
    actionLabel: string,
    onAction: () => void,
    description?: string,
  ) => {
    toast(message, {
      description,
      duration: 5000,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
    });
  },
};

// Usage examples:
// toastConfig.success("Data berhasil disimpan", "Perubahan telah tersimpan");
// toastConfig.error("Gagal menyimpan data", "Silakan coba lagi");
// toastConfig.warning("Sesi akan berakhir", "Silakan simpan pekerjaan Anda");
// toastConfig.info("Fitur baru tersedia", "Coba fitur analitik sekarang");
//
// const loadingToast = toastConfig.loading("Menyimpan data...");
// try {
//   await saveData();
//   toast.dismiss(loadingToast);
//   toastConfig.success("Berhasil!");
// } catch {
//   toast.dismiss(loadingToast);
//   toastConfig.error("Gagal");
// }
//
// toastConfig.promise(
//   fetchData(),
//   {
//     loading: "Memuat data...",
//     success: "Data berhasil dimuat",
//     error: "Gagal memuat data",
//   }
// );
```

---

## 10. Custom Theme Variables

**File:** `src/styles/theme-variables.css`

```css
/**
 * Custom Theme Variables
 * Enhanced color scheme for the application
 */

@layer base {
  :root {
    /* Base Colors */
    --radius: 0.75rem;

    /* Background & Foreground */
    --background: 40 33% 98%;
    --foreground: 24 10% 10%;

    /* Card & Popover */
    --card: 0 0% 100%;
    --card-foreground: 24 10% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 24 10% 10%;

    /* Primary - Academic Blue */
    --primary: 224 76% 40%;
    --primary-foreground: 0 0% 100%;

    /* Secondary - Warm Gold */
    --secondary: 45 93% 94%;
    --secondary-foreground: 28 73% 26%;

    /* Muted */
    --muted: 40 20% 96%;
    --muted-foreground: 25 6% 45%;

    /* Accent - Teal */
    --accent: 174 84% 29%;
    --accent-foreground: 0 0% 100%;

    /* Destructive */
    --destructive: 0 84% 50%;
    --destructive-foreground: 0 0% 100%;

    /* Border & Input */
    --border: 30 10% 90%;
    --input: 30 10% 90%;
    --ring: 224 76% 40%;

    /* Chart Colors */
    --chart-1: 224 76% 40%;
    --chart-2: 174 84% 29%;
    --chart-3: 38 92% 50%;
    --chart-4: 0 84% 50%;
    --chart-5: 262 83% 58%;

    /* Sidebar */
    --sidebar: 40 20% 96%;
    --sidebar-foreground: 24 10% 10%;
    --sidebar-primary: 224 76% 40%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 30 10% 90%;
    --sidebar-accent-foreground: 24 10% 10%;
    --sidebar-border: 30 10% 88%;
    --sidebar-ring: 224 76% 40%;

    /* Semantic Colors */
    --success: 142 76% 36%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --info: 217 91% 60%;
    --info-foreground: 0 0% 100%;
  }

  .dark {
    --background: 24 10% 5%;
    --foreground: 40 33% 98%;

    --card: 24 10% 8%;
    --card-foreground: 40 33% 98%;
    --popover: 24 10% 8%;
    --popover-foreground: 40 33% 98%;

    --primary: 217 91% 60%;
    --primary-foreground: 24 10% 5%;

    --secondary: 24 10% 15%;
    --secondary-foreground: 40 33% 90%;

    --muted: 24 10% 15%;
    --muted-foreground: 30 10% 65%;

    --accent: 168 76% 42%;
    --accent-foreground: 24 10% 5%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 24 10% 5%;

    --border: 24 10% 15%;
    --input: 24 10% 15%;
    --ring: 217 91% 60%;

    --chart-1: 217 91% 60%;
    --chart-2: 168 76% 42%;
    --chart-3: 45 93% 47%;
    --chart-4: 0 84% 60%;
    --chart-5: 262 83% 68%;

    --sidebar: 24 10% 5%;
    --sidebar-foreground: 40 33% 98%;
    --sidebar-primary: 217 91% 60%;
    --sidebar-primary-foreground: 24 10% 5%;
    --sidebar-accent: 24 10% 15%;
    --sidebar-accent-foreground: 40 33% 98%;
    --sidebar-border: 24 10% 15%;
    --sidebar-ring: 217 91% 60%;

    --success: 142 71% 45%;
    --success-foreground: 24 10% 5%;
    --warning: 45 93% 47%;
    --warning-foreground: 24 10% 5%;
    --info: 217 91% 60%;
    --info-foreground: 24 10% 5%;
  }
}

/* Custom utility classes */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .animate-in {
    animation: animateIn 0.5s ease-out forwards;
  }

  .animate-out {
    animation: animateOut 0.3s ease-in forwards;
  }

  .slide-in-from-bottom {
    animation: slideInFromBottom 0.5s ease-out forwards;
  }

  .fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }

  .scale-in {
    animation: scaleIn 0.2s ease-out forwards;
  }
}

@keyframes animateIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes animateOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🚀 Cara Menggunakan

### 1. Install Dependencies

```bash
npm install framer-motion
```

### 2. Import Theme Variables

Tambahkan di `src/index.css`:

```css
@import "./styles/theme-variables.css";
```

### 3. Setup Toast Provider

Di `src/App.tsx` atau layout utama:

```tsx
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      {/* Your app content */}
      <Toaster position="top-right" richColors />
    </>
  );
}
```

### 4. Export Components

Tambahkan di `src/components/ui/index.ts`:

```typescript
export * from "./glass-card";
export * from "./animated-counter";
export * from "./status-badge";
export * from "./stepper";
export * from "./dashboard-card";
export * from "./dashboard-skeleton";
export * from "./button-enhanced";
```

---

## 📋 Checklist Implementasi

- [ ] Buat semua file komponen di `src/components/ui/`
- [ ] Buat file hooks di `src/lib/hooks/`
- [ ] Buat file toast config di `src/lib/`
- [ ] Buat file theme variables di `src/styles/`
- [ ] Update `index.css` untuk import theme variables
- [ ] Update exports di `src/components/ui/index.ts`
- [ ] Test semua komponen di halaman contoh
- [ ] Verifikasi dark mode berfungsi
- [ ] Verifikasi reduced motion berfungsi
- [ ] Dokumentasikan penggunaan di tim

---

*Panduan ini dibuat sebagai pelengkap dokumen analisis UI/UX. Terakhir diperbarui: 7 Maret 2026*
