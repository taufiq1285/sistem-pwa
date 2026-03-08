/**
 * Toast Configuration
 * Pre-configured toast notifications with consistent styling
 */

import { toast } from "sonner";

interface ToastPromiseMessages {
  loading: string;
  success: string;
  error: string;
}

interface ToastOptions {
  description?: string;
  duration?: number;
}

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
      duration: Number.POSITIVE_INFINITY,
    });
  },

  promise: <T>(promise: Promise<T>, messages: ToastPromiseMessages) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  custom: (message: string, options?: ToastOptions) => {
    toast(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

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
