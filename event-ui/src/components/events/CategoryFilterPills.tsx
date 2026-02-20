"use client";

import { Badge } from "@/components/ui/badge";
import { allCategories } from "@/lib/lookups";

type CategoryFilterPillsProps = {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
};

export function CategoryFilterPills({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterPillsProps) {
  const categories = [{ id: "all", label: "All" }, ...allCategories];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Badge
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/90 transition-colors"
          onClick={() => onCategoryChange(category.id)}
        >
          {category.label}
        </Badge>
      ))}
    </div>
  );
}
