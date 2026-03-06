import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FilterBar, type FilterState } from './FilterBar';

interface FilterSheetProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FilterSheet({ filters, onChange }: FilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open filters">
          <SlidersHorizontal />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="pt-6">
          <FilterBar filters={filters} onChange={onChange} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

