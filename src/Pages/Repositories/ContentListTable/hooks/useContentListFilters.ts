import { useMemo } from 'react';
import { FilterData, NameLabel } from '../../../../services/Content/ContentApi';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { useRepositoryParams } from '../../../../services/Content/ContentQueries';
import useDebounce from '../../../../Hooks/useDebounce';
import { useDataViewFilters } from '@patternfly/react-data-view';
import { TreeViewDataItem } from '@patternfly/react-core';
import { SUPPORTED_MAJOR_VERSIONS } from '../../../Templates/TemplatesTable/constants';

// Mapping from display names to backend API values
const StatusDisplayMap = {
  Invalid: 'Invalid',
  'In progress': 'Pending',
  Unavailable: 'Unavailable',
  Valid: 'Valid',
} as const;

export const FilterLabelsMap = {
  Search: 'Name/URL',
  Versions: 'Operating system',
  Arches: 'Architecture',
  Statuses: 'Status',
} as const;

type RepositoryFilters = Required<Pick<FilterData, 'search' | 'arches' | 'versions' | 'statuses'>>;

export const initialFilters: RepositoryFilters = {
  search: '',
  arches: [],
  versions: [], // API-friendly versions e.g., ["9", "9.4", "10"]
  statuses: [],
};

const statusFilterOptions: DataViewFilterOption[] = Object.keys(StatusDisplayMap).map(
  (statusDisplay) =>
    ({
      label: statusDisplay,
      value: StatusDisplayMap[statusDisplay],
      ['data-ouia-component-id']: `filter_${statusDisplay}`,
    }) as unknown as DataViewFilterOption,
);

export const useContentListFilters = () => {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RepositoryFilters>({
    initialFilters,
  });

  const {
    data: {
      distribution_arches = [],
      distribution_versions = [],
      distribution_minor_versions = [],
    } = {},
  } = useRepositoryParams();

  const osFilterOptions = useMemo(() => {
    const majorVersions = distribution_versions
      .filter((version) => SUPPORTED_MAJOR_VERSIONS.includes(version.label))
      .sort((a, b) => Number(b.label) - Number(a.label));

    const minorsByMajor = new Map<string, TreeViewDataItem[]>(
      majorVersions.map((version) => [version.label, []]),
    );

    for (const minor of distribution_minor_versions) {
      minorsByMajor.get(minor.major)?.push({
        id: minor.label,
        name: minor.name,
        checkProps: { checked: false },
      });
    }

    const treeItems: TreeViewDataItem[] = [];

    for (const version of majorVersions) {
      const minorVersions = minorsByMajor.get(version.label)!;

      treeItems.push({
        id: version.label,
        name: version.name,
        checkProps: { checked: false },
      });

      if (minorVersions.length > 0) {
        treeItems.push({
          id: `${version.label}.x`,
          name: `${version.name}.x`,
          checkProps: { checked: false },
          children: minorVersions,
        });
      }
    }

    return treeItems;
  }, [distribution_versions, distribution_minor_versions]);

  const archFilterOptions: DataViewFilterOption[] = useMemo(
    () =>
      distribution_arches.map(
        (nameLabel: NameLabel) =>
          ({
            label: nameLabel.name,
            value: nameLabel.label,
            ['data-ouia-component-id']: `filter_${nameLabel.name}`,
          }) as unknown as DataViewFilterOption,
      ),
    [distribution_arches],
  );

  // Versions are excluded from debouncing because DataViewTreeFilter clears all checkboxes when
  // it receives an empty selection. Debouncing causes a brief [] state that triggers this clear
  // before the real selection arrives
  const debouncedFilters = useDebounce<Omit<RepositoryFilters, 'versions'>>(
    { search: filters.search, arches: filters.arches, statuses: filters.statuses },
    200,
  );

  const isFiltered =
    debouncedFilters.search !== '' ||
    debouncedFilters.arches.length > 0 ||
    debouncedFilters.statuses.length > 0 ||
    filters.versions.length > 0;

  return {
    filters: { ...debouncedFilters, versions: filters.versions },
    onSetFilters,
    clearAllFilters,
    isFiltered,
    archFilterOptions,
    statusFilterOptions,
    osFilterOptions,
  };
};
