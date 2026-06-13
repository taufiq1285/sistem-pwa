/**
 * PageTransition Component
 * Provides a slide-up and fade transition using framer-motion when routes change.
 */

import { type ReactNode, type ReactElement } from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({
  children,
}: PageTransitionProps): ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
