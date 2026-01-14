import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  X, 
  CreditCard, 
  CheckSquare, 
  Wallet,
  Calendar,
  SortAsc,
  SortDesc
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SearchFilters {
  query: string;
  types: ('subscriptions' | 'tasks' | 'installments')[];
  status: 'all' | 'active' | 'completed' | 'pending';
  sortBy: 'name' | 'value' | 'date';
  sortOrder: 'asc' | 'desc';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface UnifiedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  resultCount?: number;
}

export function UnifiedSearch({ filters, onFiltersChange, resultCount }: UnifiedSearchProps) {
  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleType = (type: 'subscriptions' | 'tasks' | 'installments') => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    
    // Keep at least one type selected
    if (newTypes.length > 0) {
      updateFilter('types', newTypes);
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      types: ['subscriptions', 'tasks', 'installments'],
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      dateRange: 'all',
    });
  };

  const hasActiveFilters = 
    filters.query !== '' || 
    filters.types.length !== 3 || 
    filters.status !== 'all' ||
    filters.dateRange !== 'all';

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar assinaturas, tarefas ou parcelas..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tipos</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.types.includes('subscriptions')}
              onCheckedChange={() => toggleType('subscriptions')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Assinaturas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.types.includes('tasks')}
              onCheckedChange={() => toggleType('tasks')}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Tarefas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.types.includes('installments')}
              onCheckedChange={() => toggleType('installments')}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Parcelas
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Período</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.dateRange === 'all'}
              onCheckedChange={() => updateFilter('dateRange', 'all')}
            >
              Todos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.dateRange === 'today'}
              onCheckedChange={() => updateFilter('dateRange', 'today')}
            >
              Hoje
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.dateRange === 'week'}
              onCheckedChange={() => updateFilter('dateRange', 'week')}
            >
              Esta semana
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.dateRange === 'month'}
              onCheckedChange={() => updateFilter('dateRange', 'month')}
            >
              Este mês
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value: 'name' | 'value' | 'date') => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="value">Valor</SelectItem>
              <SelectItem value="date">Data</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.types.length < 3 && (
            <>
              {filters.types.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type === 'subscriptions' && <><CreditCard className="h-3 w-3" /> Assinaturas</>}
                  {type === 'tasks' && <><CheckSquare className="h-3 w-3" /> Tarefas</>}
                  {type === 'installments' && <><Wallet className="h-3 w-3" /> Parcelas</>}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                    onClick={() => toggleType(type)}
                  />
                </Badge>
              ))}
            </>
          )}
          {filters.dateRange !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {filters.dateRange === 'today' && 'Hoje'}
              {filters.dateRange === 'week' && 'Esta semana'}
              {filters.dateRange === 'month' && 'Este mês'}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilter('dateRange', 'all')}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Limpar filtros
          </Button>
          {resultCount !== undefined && (
            <span className="text-xs text-muted-foreground ml-auto">
              {resultCount} resultado{resultCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
