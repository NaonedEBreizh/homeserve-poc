"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

function DialogOverlay({
  className = "",
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      // z-50 : le voile doit passer au-dessus des barres collantes des écrans.
      className={`fixed inset-0 z-50 bg-neutre-700/45 ${className}`}
      {...props}
    />
  );
}

function DialogContent({
  className = "",
  children,
  pleinEcran = false,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  /** Feuille plein écran sur mobile, carte centrée à partir de `sm`. */
  pleinEcran?: boolean;
}) {
  const position = pleinEcran
    ? "fixed inset-0 z-50 flex w-full flex-col bg-white sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90dvh] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-tuile sm:shadow-lg"
    : "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-tuile bg-white p-6 shadow-lg";

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content className={`${position} ${className}`} {...props}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
};
