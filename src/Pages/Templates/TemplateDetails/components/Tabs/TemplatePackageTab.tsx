import PackagesTableWithToolbars from 'components/Tables/Packages/PackagesTableWithToolbars';
import { useFetchTemplatePackages } from 'services/Templates/TemplateQueries';
import { useTablePaginationLocalStorage } from 'components/Tables/Generic/hooks/useTablePaginationLocalStorage';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { usePackageTableFilters } from 'components/Tables/Packages/hooks/usePackageTableFilters';

const perPageKey = 'TemplatePackagePerPage';

export default function TemplatePackageTab() {
  const templateUUID = useSafeUUIDParam('templateUUID');

  const filterData = usePackageTableFilters();
  const { debouncedSearch } = filterData;

  const paginationData = useTablePaginationLocalStorage({ key: perPageKey });
  const { page, perPage } = paginationData;

  const {
    isLoading,
    isFetching,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useFetchTemplatePackages(page, perPage, debouncedSearch, templateUUID);

  const {
    data: packagesList = [],
    meta: { count = 0 },
  } = data;

  return (
    <div className={spacing.pSm}>
      <PackagesTableWithToolbars
        packagesList={packagesList}
        isFetching={isFetching}
        isLoading={isLoading}
        paginationData={paginationData}
        count={count}
        filterProps={{ ...filterData }}
      />
    </div>
  );
}
