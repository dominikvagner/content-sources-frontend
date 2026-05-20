import { Package } from 'services/Content/ContentApi';
import EmptyTableDataView from 'components/EmptyTableDataView/EmptyTableDataView';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import {
  DataViewTable,
  DataViewTh,
  DataViewTrObject,
} from '@patternfly/react-data-view/dist/dynamic/DataViewTable';

type BasicTable = {
  items: Package[];
};

export const PackagesTableBasic = ({ items = [] }: BasicTable) => {
  // rows and columns
  const columns = [{ name: 'Name' }, { name: 'Architecture' }];
  const dataViewColumns: DataViewTh[] = columns.map(({ name }) => ({ cell: name }));
  const dataViewRows: DataViewTrObject[] = items.map((packageRpm) => {
    const { name, arch } = packageRpm;
    const cells = [{ cell: name }, { cell: arch }];

    if (packageRpm.uuid !== undefined) {
      return {
        id: packageRpm.uuid,
        row: cells,
      };
    }
    return {
      id: `${name}-${arch}`,
      row: cells,
    };
  });

  // table states
  const ouiaId = 'confirm_delete_packages_table';
  const emptyStateTable = (
    <EmptyTableDataView
      ouiaId={ouiaId}
      variant='zero'
      itemName='packages'
      zeroBody='You may need to add packages to delete.'
      colSpan={columns.length}
    />
  );
  const loadingStateTable = (
    <SkeletonTableBody rowsCount={items.length} columnsCount={columns.length} />
  );
  return (
    <DataView data-ouia-component-id='packages_for_deletion_table'>
      <DataViewTable
        aria-label='Confirm Delete Packages Table'
        ouiaId={ouiaId}
        variant='compact'
        columns={dataViewColumns}
        rows={dataViewRows}
        bodyStates={{ empty: emptyStateTable, loading: loadingStateTable }}
      />
    </DataView>
  );
};
