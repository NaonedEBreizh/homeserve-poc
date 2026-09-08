import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

describe("Dialog", () => {
  it("opens on trigger and exposes an accessible title", () => {
    render(
      <Dialog>
        <DialogTrigger>Ouvrir</DialogTrigger>
        <DialogContent>
          <DialogTitle>Confirmer l&apos;intervention</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir" }));

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(
      screen.getByText("Confirmer l'intervention"),
    ).toBeDefined();
  });
});

describe("Popover", () => {
  it("reveals its content once the trigger is activated", () => {
    render(
      <Popover>
        <PopoverTrigger>Détails</PopoverTrigger>
        <PopoverContent>Créneau de 9h à 12h</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Créneau de 9h à 12h")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Détails" }));

    expect(screen.getByText("Créneau de 9h à 12h")).toBeDefined();
  });
});

describe("RadioGroup", () => {
  it("exposes one checked radio at a time", () => {
    render(
      <RadioGroup defaultValue="matin" aria-label="Créneau">
        <RadioGroupItem value="matin" aria-label="Matin" />
        <RadioGroupItem value="apresmidi" aria-label="Après-midi" />
      </RadioGroup>,
    );

    const matin = screen.getByRole("radio", { name: "Matin" });
    const apresMidi = screen.getByRole("radio", { name: "Après-midi" });

    expect(matin.getAttribute("aria-checked")).toBe("true");
    expect(apresMidi.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(apresMidi);

    expect(matin.getAttribute("aria-checked")).toBe("false");
    expect(apresMidi.getAttribute("aria-checked")).toBe("true");
  });
});
