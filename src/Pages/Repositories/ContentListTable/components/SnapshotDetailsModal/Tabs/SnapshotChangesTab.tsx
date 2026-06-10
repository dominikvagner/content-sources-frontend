import { Pagination } from '@patternfly/react-core';
import { DataView, DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewFilters } from '@patternfly/react-data-view/dist/dynamic/DataViewFilters';
import { DataViewTextFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewTextFilter';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import {
  DataViewTable,
  DataViewTh,
  DataViewTrObject,
} from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { LongArrowAltDownIcon, LongArrowAltUpIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import {
  t_global_color_status_danger_default,
  t_global_color_status_success_default,
  t_global_text_color_subtle,
} from '@patternfly/react-tokens';
import { useEffect, useMemo } from 'react';
import { createUseStyles } from 'react-jss';

import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';
import EmptyTableDataView from 'components/EmptyTableDataView/EmptyTableDataView';
import { usePackageTableFilters } from 'components/Tables/Packages/hooks/usePackageTableFilters';
import { useTablePaginationLocalStorage } from 'components/Tables/Generic/hooks/useTablePaginationLocalStorage';
import { type Package } from 'services/Content/ContentApi';
import { useGetSnapshotDetailQuery } from 'services/Content/ContentQueries';

const perPageKey = 'snapshotChangesPerPage';

const useStyles = createUseStyles({
  cellLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cellLine: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  nameWithStatus: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  subduedLine: {
    color: t_global_text_color_subtle.var,
  },
  replacingText: {
    fontWeight: 400,
  },
  addedIcon: {
    color: t_global_color_status_success_default.var,
  },
  removedIcon: {
    color: t_global_color_status_danger_default.var,
  },
  updatedIcon: {
    color: t_global_color_status_success_default.var,
  },
});

type SnapshotChangeRow = {
  id: string;
  name: string;
  arch: string;
  added?: Package;
  removed?: Package;
};

type PackageField = 'name' | 'version' | 'release' | 'arch';
type PackageStatus = 'default' | 'added' | 'removed' | 'updated';

const packageKey = ({ name, arch }: Package) => `${name}::${arch}`;

export const buildSnapshotChangeRows = (
  addedPackages: Package[] = [],
  removedPackages: Package[] = [],
): SnapshotChangeRow[] => {
  const groupedPackages = new Map<
    string,
    { name: string; arch: string; added: Package[]; removed: Package[] }
  >();
  const orderedKeys: string[] = [];

  const addToGroup = (packageItem: Package, changeType: 'added' | 'removed') => {
    const key = packageKey(packageItem);
    if (!groupedPackages.has(key)) {
      orderedKeys.push(key);
      groupedPackages.set(key, {
        name: packageItem.name,
        arch: packageItem.arch,
        added: [],
        removed: [],
      });
    }

    groupedPackages.get(key)?.[changeType].push(packageItem);
  };

  addedPackages.forEach((packageItem) => addToGroup(packageItem, 'added'));
  removedPackages.forEach((packageItem) => addToGroup(packageItem, 'removed'));

  return orderedKeys.flatMap((key) => {
    const groupedPackage = groupedPackages.get(key);
    if (!groupedPackage) {
      return [];
    }

    const rowCount = Math.max(groupedPackage.added.length, groupedPackage.removed.length);

    return Array.from({ length: rowCount }, (_, index) => ({
      id: `${key}-${index}`,
      name: groupedPackage.name,
      arch: groupedPackage.arch,
      added: groupedPackage.added[index],
      removed: groupedPackage.removed[index],
    }));
  });
};

export function SnapshotChangesTab() {
  const classes = useStyles();
  const repoUUID = useSafeUUIDParam('repoUUID');
  const snapshotUUID = useSafeUUIDParam('snapshotUUID');
  const onClose = useNavigateTo('root');
  const paginationData = useTablePaginationLocalStorage({ key: perPageKey });
  const filterData = usePackageTableFilters();
  const { page, perPage, setPage } = paginationData;
  const { filters, onSetFilters, clearAllFilters } = filterData;

  const { isLoading, isFetching, isError, data } = useGetSnapshotDetailQuery(
    repoUUID,
    snapshotUUID,
  );

  useEffect(() => {
    if (isError) {
      onClose();
    }
  }, [isError, onClose]);

  const allRows = useMemo(
    () => buildSnapshotChangeRows(data?.added_packages ?? [], data?.removed_packages ?? []),
    [data?.added_packages, data?.removed_packages],
  );

  const filteredRows = useMemo(() => {
    if (!filters.search) {
      return allRows;
    }

    const normalizedSearch = filters.search.trim().toLowerCase();
    return allRows.filter(({ name }) => name.toLowerCase().includes(normalizedSearch));
  }, [allRows, filters.search]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredRows.length / perPage));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredRows.length, page, perPage, setPage]);

  const visibleRows = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filteredRows.slice(startIndex, startIndex + perPage);
  }, [filteredRows, page, perPage]);

  const isFetchingOrLoading = isFetching || isLoading;
  const activeState = useMemo(() => {
    if (isFetchingOrLoading) {
      return DataViewState.loading;
    }

    if (!filteredRows.length) {
      return DataViewState.empty;
    }

    return undefined;
  }, [filteredRows.length, isFetchingOrLoading]);

  const paginationProps = {
    itemCount: filteredRows.length,
    page,
    perPage,
    onSetPage: paginationData.onSetPage,
    onPerPageSelect: paginationData.onPerPageSelect,
  };

  const clearAllFiltersAndResetPage = () => {
    clearAllFilters();
    setPage(1);
  };

  const handleFilterChange = (_key, newValues) => {
    onSetFilters(newValues);
    setPage(1);
  };

  const renderCellLine = (
    packageItem: Package | undefined,
    field: PackageField,
    {
      status = 'default',
      subdued = false,
      cueText,
    }: { status?: PackageStatus; subdued?: boolean; cueText?: string } = {},
  ) => {
    if (!packageItem) {
      return null;
    }

    const lineClasses = [classes.cellLine];

    if (subdued) {
      lineClasses.push(classes.subduedLine);
    }

    const renderStatusIcon = () => {
      switch (status) {
        case 'added':
          return (
            <span className={classes.addedIcon} role='img' aria-label='Added package'>
              <LongArrowAltUpIcon aria-hidden='true' />
            </span>
          );
        case 'removed':
          return (
            <span className={classes.removedIcon} role='img' aria-label='Removed package'>
              <LongArrowAltDownIcon aria-hidden='true' />
            </span>
          );
        case 'updated':
          return (
            <span className={classes.updatedIcon} role='img' aria-label='Updated package'>
              <LongArrowAltUpIcon aria-hidden='true' />
            </span>
          );
        default:
          return null;
      }
    };

    return (
      <span className={lineClasses.join(' ')}>
        {field === 'name' ? (
          <span className={classes.nameWithStatus}>
            {status !== 'default' ? renderStatusIcon() : null}
            {cueText ? <span className={classes.replacingText}>{cueText}</span> : null}
            <span>{packageItem[field]}</span>
          </span>
        ) : (
          <span>{packageItem[field]}</span>
        )}
      </span>
    );
  };

  const renderChangeCell = (row: SnapshotChangeRow, field: PackageField) => {
    const hasAddedPackage = Boolean(row.added);
    const hasRemovedPackage = Boolean(row.removed);
    const addedOnly = hasAddedPackage && !hasRemovedPackage;
    const removedOnly = !hasAddedPackage && hasRemovedPackage;
    const replacing = hasAddedPackage && hasRemovedPackage;

    return (
      <div className={classes.cellLines}>
        {renderCellLine(hasAddedPackage ? row.added : row.removed, field, {
          status: addedOnly ? 'added' : removedOnly ? 'removed' : replacing ? 'updated' : 'default',
        })}
        {replacing
          ? renderCellLine(row.removed, field, {
              subdued: true,
              cueText: field === 'name' ? 'replacing' : undefined,
            })
          : null}
      </div>
    );
  };

  const columns = [
    { name: 'Name' },
    { name: 'Version' },
    { name: 'Release' },
    { name: 'Architecture' },
  ];

  const dataViewColumns: DataViewTh[] = columns.map(({ name }) => ({ cell: name }));
  const dataViewRows: DataViewTrObject[] = visibleRows.map((row) => ({
    id: row.id,
    row: [
      { cell: renderChangeCell(row, 'name') },
      { cell: renderChangeCell(row, 'version') },
      { cell: renderChangeCell(row, 'release') },
      { cell: renderChangeCell(row, 'arch') },
    ],
  }));

  const topPagination = (
    <Pagination
      id='top-pagination-id'
      widgetId='topPaginationWidgetId'
      {...paginationProps}
      isCompact
      isDisabled={isFetchingOrLoading}
    />
  );

  const bottomPagination = (
    <Pagination
      id='bottom-pagination-id'
      widgetId='bottomPaginationWidgetId'
      {...paginationProps}
      variant='bottom'
    />
  );

  const searchFilter = (
    <DataViewFilters values={filters} onChange={handleFilterChange}>
      <DataViewTextFilter
        filterId='search'
        ouiaId='filter_snapshot_changes_search'
        title='Name'
        placeholder='Filter by name'
        isDisabled={isFetchingOrLoading}
      />
    </DataViewFilters>
  );

  const emptyStateTable = (
    <EmptyTableDataView
      ouiaId='snapshot_changes_table'
      variant={filters.search ? 'filtered' : 'zero'}
      itemName='package changes'
      zeroBody='This snapshot has no package changes.'
      colSpan={columns.length}
      onClearFilters={clearAllFiltersAndResetPage}
    />
  );

  const loadingStateTable = <SkeletonTableBody rowsCount={perPage} columnsCount={columns.length} />;

  return (
    <DataView data-ouia-component-id='snapshot_changes_table' activeState={activeState}>
      <DataViewToolbar
        className={spacing.pSm}
        clearAllFilters={clearAllFiltersAndResetPage}
        filters={searchFilter}
        pagination={topPagination}
      />
      <DataViewTable
        aria-label='Snapshot changes table'
        ouiaId='snapshot_changes_table'
        variant='compact'
        columns={dataViewColumns}
        rows={dataViewRows}
        bodyStates={{ empty: emptyStateTable, loading: loadingStateTable }}
      />
      <DataViewToolbar pagination={bottomPagination} />
    </DataView>
  );
}
