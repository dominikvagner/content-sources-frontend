import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { Package } from 'services/Content/ContentApi';
import Hide from '../../Hide/Hide';
import { Grid } from '@patternfly/react-core';
import { SkeletonTable } from '@patternfly/react-component-groups';
import { createUseStyles } from 'react-jss';
import { useEffect, useState } from 'react';
import EmptyTableState from 'components/EmptyTableState/EmptyTableState';

const useStyles = createUseStyles({
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
});

interface Props {
  isFetchingOrLoading: boolean;
  isLoadingOrZeroCount: boolean;
  packagesList: Package[];
  clearSearch: () => void;
  perPage: number;
  search: string;
}

const PackagesTableWithToolbars = ({
  isFetchingOrLoading,
  isLoadingOrZeroCount,
  packagesList,
  clearSearch,
  perPage,
  search,
}: Props) => {
  const classes = useStyles();
  const [prevLength, setPrev] = useState(perPage || 10);

  useEffect(() => {
    setPrev(packagesList.length || 10);
  }, [packagesList.length]);

  const columnHeaders = ['Name', 'Version', 'Release', 'Architecture'];

  return (
    <>
      <Hide hide={!isFetchingOrLoading}>
        <Grid className={classes.mainContainer}>
          <SkeletonTable
            rows={prevLength}
            columnsCount={columnHeaders.length}
            variant={TableVariant.compact}
          />
        </Grid>
      </Hide>
      <Hide hide={isFetchingOrLoading}>
        <Table aria-label='packages table' ouiaId='packages_table' variant='compact'>
          <Hide hide={isLoadingOrZeroCount}>
            <Thead>
              <Tr>
                {columnHeaders.map((columnHeader) => (
                  <Th key={columnHeader + '_column'}>{columnHeader}</Th>
                ))}
              </Tr>
            </Thead>
          </Hide>
          {packagesList.map(({ name, version, release, arch }: Package, index: number) => (
            <Tbody key={name + index}>
              <Tr>
                <Td>{name}</Td>
                <Td>{version}</Td>
                <Td>{release}</Td>
                <Td>{arch}</Td>
              </Tr>
            </Tbody>
          ))}
        </Table>
        <Hide hide={!isLoadingOrZeroCount}>
          <EmptyTableState
            notFiltered={!search?.length}
            clearFilters={clearSearch}
            itemName='packages'
            notFilteredBody='You may need to add repositories that contain packages.'
          />
        </Hide>
      </Hide>
    </>
  );
};

export default PackagesTableWithToolbars;
