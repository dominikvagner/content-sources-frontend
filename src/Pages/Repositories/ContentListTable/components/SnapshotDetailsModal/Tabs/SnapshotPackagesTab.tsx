import { useEffect } from 'react';
import { useGetSnapshotPackagesQuery } from 'services/Content/ContentQueries';
import PackagesTableWithToolbars from 'components/Tables/Packages/PackagesTableWithToolbars';
import { useTablePaginationLocalStorage } from 'components/Tables/Generic/hooks/useTablePaginationLocalStorage';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { usePackageTableFilters } from 'components/Tables/Packages/hooks/usePackageTableFilters';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';

const perPageKey = 'snapshotPackagePerPage';

export function SnapshotPackagesTab() {
  const snapshotUUID = useSafeUUIDParam('snapshotUUID');

  const onClose = useNavigateTo('root');

  const filterData = usePackageTableFilters();
  const { debouncedSearch } = filterData;

  const paginationData = useTablePaginationLocalStorage({ key: perPageKey });
  const { page, perPage } = paginationData;

  const {
    isLoading,
    isFetching,
    isError,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useGetSnapshotPackagesQuery(snapshotUUID, page, perPage, debouncedSearch);

  useEffect(() => {
    if (isError) {
      onClose();
    }
  }, [isError, onClose]);

  const {
    data: packagesList = [],
    meta: { count = 0 },
  } = data;

  return (
    <PackagesTableWithToolbars
      packagesList={packagesList}
      paginationData={paginationData}
      isFetching={isFetching}
      isLoading={isLoading}
      count={count}
      filterProps={{ ...filterData }}
    />
  );
}
