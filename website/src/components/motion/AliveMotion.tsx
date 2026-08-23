"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";

const spring = { type: "spring" as const, stiffness: 380, damping: 22 };

export function PressLift({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className={clsx(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function LivePulse({ className }: { className?: string }) {
  return (
    <span className={clsx("relative inline-flex h-2.5 w-2.5", className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E3AFF] opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1E3AFF]" />
    </span>
  );
}

/** Soft progress bar fill on view. */
export function AliveProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={clsx(
        "h-1.5 w-full overflow-hidden rounded-full bg-white/10",
        className,
      )}
    >
      <motion.div
        className="h-full rounded-full bg-[#1E3AFF]"
        initial={{ width: 0 }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
