"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { ComponentProps } from "react";

function RadioGroup({
  className = "",
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root className={`grid gap-2 ${className}`} {...props} />
  );
}

function RadioGroupItem({
  className = "",
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={`size-4 rounded-full border border-slate-300 outline-none disabled:opacity-50 dark:border-slate-700 ${className}`}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="block size-2 rounded-full bg-brand-500" />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
