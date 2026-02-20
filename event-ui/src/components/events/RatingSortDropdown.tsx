"use client";

import { ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type SortOption = "rating" | "date" | "upcoming";

type RatingSortDropdownProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export function RatingSortDropdown({ value, onChange }: RatingSortDropdownProps) {
  const sortLabels: Record<SortOption, string> = {
    rating: "Top Rated",
    date: "Event Date",
    upcoming: "Upcoming First",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Sort: {sortLabels[value]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as SortOption)}>
          <DropdownMenuRadioItem value="rating">Top Rated</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">Event Date</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="upcoming">Upcoming First</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
