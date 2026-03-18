import { MapPin } from 'lucide-react';
import { Button, Chip, Input } from '@nextui-org/react';
import { SearchBar } from './SearchBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JOB_SOURCES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface FilterState {
  q: string;
  location: string;
  source: string;
  remote: boolean;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

export function FilterBar({ filters, onChange, className }: FilterBarProps) {
  const hasActiveFilters =
    filters.q || filters.location || filters.source || filters.remote;

  const handleClearFilters = () => {
    onChange({
      q: '',
      location: '',
      source: '',
      remote: false,
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Primary filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <SearchBar
            value={filters.q}
            onChange={(q) => onChange({ ...filters, q })}
            placeholder="Search by title, company, or keywords..."
          />
        </div>

        {/* Location */}
        <div className="relative sm:w-48">
          <Input
            type="text"
            placeholder="Location"
            value={filters.location}
            onValueChange={(location) => onChange({ ...filters, location })}
            variant="bordered"
            size="sm"
            startContent={<MapPin className="h-4 w-4 text-muted-foreground shrink-0" />}
            aria-label="Filter by location"
            classNames={{
              input: "text-foreground text-sm",
              inputWrapper: "border-white/10 bg-white/5 hover:bg-white/10 data-[focus=true]:border-primary/50 h-10",
            }}
          />
        </div>

        {/* Source */}
        <div className="sm:w-44">
          <Select
            value={filters.source || '__all__'}
            onValueChange={(source: string) =>
              onChange({ ...filters, source: source === '__all__' ? '' : source })
            }
          >
            <SelectTrigger aria-label="Filter by job source">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sources</SelectItem>
              {JOB_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Secondary filters row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Remote toggle */}
          <Button
            variant={filters.remote ? 'solid' : 'bordered'}
            color={filters.remote ? 'primary' : 'default'}
            size="sm"
            onPress={() => onChange({ ...filters, remote: !filters.remote })}
            className={cn(
              'h-8 transition-all duration-300',
              filters.remote && 'shadow-lg shadow-primary/25',
              !filters.remote && 'border-white/20 text-foreground hover:border-primary/50 hover:text-primary'
            )}
            aria-pressed={filters.remote}
          >
            Remote only
          </Button>

          {/* Active filter chips */}
          {filters.q && (
            <Chip
              variant="flat"
              size="sm"
              onClose={() => onChange({ ...filters, q: '' })}
              classNames={{
                base: "bg-white/5 border border-white/10 text-foreground",
                closeButton: "text-muted-foreground hover:text-foreground",
              }}
            >
              Search: {filters.q.slice(0, 20)}
              {filters.q.length > 20 && '...'}
            </Chip>
          )}
          {filters.location && (
            <Chip
              variant="flat"
              size="sm"
              onClose={() => onChange({ ...filters, location: '' })}
              classNames={{
                base: "bg-white/5 border border-white/10 text-foreground",
                closeButton: "text-muted-foreground hover:text-foreground",
              }}
            >
              Location: {filters.location}
            </Chip>
          )}
          {filters.source && (
            <Chip
              variant="flat"
              size="sm"
              onClose={() => onChange({ ...filters, source: '' })}
              classNames={{
                base: "bg-white/5 border border-white/10 text-foreground",
                closeButton: "text-muted-foreground hover:text-foreground",
              }}
            >
              Source: {JOB_SOURCES.find((s) => s.value === filters.source)?.label}
            </Chip>
          )}
        </div>

        {/* Clear all button */}
        {hasActiveFilters && (
          <Button
            variant="light"
            size="sm"
            onPress={handleClearFilters}
            className="h-8 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}
