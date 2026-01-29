import type { ReactNode } from "react";

export type ToasterProps = Record<string, unknown>;

export const toast = {
  success: () => undefined,
  error: () => undefined,
  warning: () => undefined,
  info: () => undefined,
  message: () => undefined,
  promise: () => undefined,
};

export function Toaster(_props: ToasterProps & { children?: ReactNode }) {
  return null;
}
