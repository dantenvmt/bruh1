import { X, MapPin } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="pl-9"
            aria-label="Filter by location"
          />
        </div>

        {/* Source */}
        <div className="sm:w-44">
          <Select
            value={filters.source || '__all__'}
            onValueChange={(source: string) => onChange({ ...filters, source: source === '__all__' ? '' : source })}
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
            variant={filters.remote ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange({ ...filters, remote: !filters.remote })}
            className={cn(
              'h-8 border-border/70 transition-all duration-300',
              filters.remote && 'shadow-lg shadow-primary/25',
              !filters.remote && 'hover:border-primary/50 hover:bg-muted/60 hover:text-primary'
            )}
            aria-pressed={filters.remote}
          >
            Remote only
          </Button>

          {/* Active filter badges */}
          {filters.q && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.q.slice(0, 20)}
              {filters.q.length > 20 && '...'}
              <button
                onClick={() => onChange({ ...filters, q: '' })}
                className="ml-1 hover:bg-background/20 rounded-full"
                aria-label="Clear search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              Location: {filters.location}
              <button
                onClick={() => onChange({ ...filters, location: '' })}
                className="ml-1 hover:bg-background/20 rounded-full"
                aria-label="Clear location filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.source && (
            <Badge variant="secondary" className="gap-1">
              Source: {JOB_SOURCES.find((s) => s.value === filters.source)?.label}
              <button
                onClick={() => onChange({ ...filters, source: '' })}
                className="ml-1 hover:bg-background/20 rounded-full"
                aria-label="Clear source filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        {/* Clear all button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}
