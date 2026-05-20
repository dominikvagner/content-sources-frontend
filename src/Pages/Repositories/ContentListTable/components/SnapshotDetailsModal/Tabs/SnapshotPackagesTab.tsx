import {
  Grid,
  InputGroup,
  InputGroupItem,
  TextInput,
  Pagination,
  Flex,
  FlexItem,
  PaginationVariant,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import Hide from 'components/Hide/Hide';
import { ContentOrigin } from 'services/Content/ContentApi';
import { createUseStyles } from 'react-jss';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useDebounce from 'Hooks/useDebounce';
import useRootPath from 'Hooks/useRootPath';
import { useAppContext } from 'middleware/AppContext';
import { useGetSnapshotPackagesQuery } from 'services/Content/ContentQueries';
import PackagesTableWithToolbars from 'components/Tables/Packages/PackagesTableWithToolbars';

const useStyles = createUseStyles({
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  topContainer: {
    justifyContent: 'space-between',
    padding: '16px 24px 16px 0',
    height: 'fit-content',
  },
  bottomContainer: {
    justifyContent: 'space-between',
  },
});

const perPageKey = 'snapshotPackagePerPage';

export function SnapshotPackagesTab() {
  const classes = useStyles();
  const { contentOrigin } = useAppContext();

  const { snapshotUUID = '' } = useParams();
  const rootPath = useRootPath();
  const navigate = useNavigate();
  const storedPerPage = Number(localStorage.getItem(perPageKey)) || 20;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(storedPerPage);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, !searchQuery ? 0 : 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const {
    isLoading,
    isFetching,
    isError,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useGetSnapshotPackagesQuery(snapshotUUID, page, perPage, debouncedSearchQuery);

  useEffect(() => {
    if (isError) {
      onClose();
    }
  }, [isError]);

  const onSetPage = (_, newPage) => setPage(newPage);

  const onPerPageSelect = (_, newPerPage, newPage) => {
    setPerPage(newPerPage);
    setPage(newPage);
    localStorage.setItem(perPageKey, newPerPage.toString());
  };

  const onClose = () =>
    navigate(
      rootPath +
        (contentOrigin.length === 1 && contentOrigin[0] === ContentOrigin.REDHAT
          ? `?origin=${contentOrigin}`
          : ''),
    );

  const {
    data: packagesList = [],
    meta: { count = 0 },
  } = data;

  const fetchingOrLoading = isFetching || isLoading;

  const loadingOrZeroCount = fetchingOrLoading || !count;
  return (
    <Grid className={classes.mainContainer}>
      <InputGroup className={classes.topContainer}>
        <InputGroupItem>
          <TextInput
            id='search'
            ouiaId='name_search'
            placeholder='Filter by name'
            value={searchQuery}
            type='search'
            customIcon={<SearchIcon />}
            onChange={(_event, value) => setSearchQuery(value)}
          />
        </InputGroupItem>
        <Hide hide={isLoading}>
          <Pagination
            id='top-pagination-id'
            widgetId='topPaginationWidgetId'
            itemCount={count}
            perPage={perPage}
            page={page}
            onSetPage={onSetPage}
            isCompact
            onPerPageSelect={onPerPageSelect}
          />
        </Hide>
      </InputGroup>
      <PackagesTableWithToolbars
        packagesList={packagesList}
        isFetchingOrLoading={fetchingOrLoading}
        isLoadingOrZeroCount={loadingOrZeroCount}
        clearSearch={() => setSearchQuery('')}
        perPage={perPage}
        search={debouncedSearchQuery}
      />
      <Flex className={classes.bottomContainer}>
        <FlexItem />
        <FlexItem>
          <Hide hide={isLoading}>
            <Pagination
              id='bottom-pagination-id'
              widgetId='bottomPaginationWidgetId'
              itemCount={count}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              variant={PaginationVariant.bottom}
              onPerPageSelect={onPerPageSelect}
            />
          </Hide>
        </FlexItem>
      </Flex>
    </Grid>
  );
}
