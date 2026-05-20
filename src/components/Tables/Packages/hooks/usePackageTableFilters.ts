import { useDataViewFilters } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import useDebounce from 'Hooks/useDebounce';

export type PackageTableFilters = { search: string; category: string[] };
export const initialPackageFilters: PackageTableFilters = {
  search: '',
  category: [],
};

export type FilterProps = ReturnType<typeof useDataViewFilters<PackageTableFilters>> & {
  debouncedSearch: string;
};

export const usePackageTableFilters = (): FilterProps => {
  const filterProps = useDataViewFilters<PackageTableFilters>({
    initialFilters: initialPackageFilters,
  });
  const { filters } = filterProps;
  const debouncedSearch = useDebounce(filters.search, !filters.search ? 0 : 500);

  return { ...filterProps, debouncedSearch };
};
