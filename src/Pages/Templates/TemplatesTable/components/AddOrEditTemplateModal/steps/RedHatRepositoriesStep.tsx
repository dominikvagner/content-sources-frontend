import {
  Bullseye,
  Flex,
  FlexItem,
  Grid,
  InputGroup,
  InputGroupItem,
  Pagination,
  PaginationVariant,
  Content,
  TextInput,
  ContentVariants,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import { createUseStyles } from 'react-jss';
import { ContentItem, ContentOrigin } from 'services/Content/ContentApi';
import { useState } from 'react';
import { useContentListQuery } from 'services/Content/ContentQueries';
import { SearchIcon } from '@patternfly/react-icons';
import EmptyTableState from 'components/EmptyTableState/EmptyTableState';
import { useHref } from 'react-router-dom';
import Hide from 'components/Hide/Hide';
import { SkeletonTable } from '@patternfly/react-component-groups';
import { Table, TableVariant, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import UrlWithExternalIcon from 'components/UrlWithLinkIcon/UrlWithLinkIcon';
import PackageCount from 'Pages/Repositories/ContentListTable/components/PackageCount';
import useDebounce from 'Hooks/useDebounce';
import { REPOSITORIES_ROUTE } from 'Routes/constants';
import TdWithTooltip from 'components/TdWithTooltip/TdWithTooltip';
import { reduceStringToCharsWithEllipsis } from 'helpers';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';

const useStyles = createUseStyles({
  topBottomContainers: {
    justifyContent: 'space-between',
    height: 'fit-content',
  },
  invisible: {
    opacity: 0,
  },
});

export default function RedHatRepositoriesStep() {
  const classes = useStyles();
  const path = useHref('content');
  const pathname = path.split('content')[0] + 'content';

  const { redHatCoreRepos, templateRequest, selectedRedHatRepos, setSelectedRedHatRepos } =
    useAddOrEditTemplateContext();

  const [showAllToggle, setShowAllToggle] = useState(true);

  const hasOnlyCoreRepos = selectedRedHatRepos.size - redHatCoreRepos.size === 0;

  const handleRepoSelection = (uuid: string) => {
    const newSelectedRepos = new Set(selectedRedHatRepos);
    if (newSelectedRepos.has(uuid)) {
      newSelectedRepos.delete(uuid);
    } else {
      newSelectedRepos.add(uuid);
    }
    setSelectedRedHatRepos(newSelectedRepos);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [activeSortIndex, setActiveSortIndex] = useState<number>(0);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc'>('asc');

  const onSetPage = (_, newPage: number) => setPage(newPage);
  const onPerPageSelect = (_, newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const columnHeaders = ['Name', /* 'Label',*/ 'Advisories', 'Packages'];

  const columnSortAttributes = ['name'];

  const sortString = (): string =>
    columnSortAttributes[activeSortIndex] + ':' + activeSortDirection;

  const sortParams = (columnIndex: number): ThProps['sort'] =>
    columnSortAttributes[columnIndex]
      ? {
          sortBy: {
            index: activeSortIndex,
            direction: activeSortDirection,
            defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
          },
          onSort: (_event, index, direction) => {
            setActiveSortIndex(index);
            setActiveSortDirection(direction);
          },
          columnIndex,
        }
      : undefined;

  const { isLoading, data = { data: [], meta: { count: 0, limit: 20, offset: 0 } } } =
    useContentListQuery(
      page,
      perPage,
      {
        search: searchQuery === '' ? searchQuery : debouncedSearch,
        availableForArch: templateRequest.arch!,
        availableForVersion: templateRequest.version!,
        extended_release: templateRequest.extended_release,
        extended_release_version: templateRequest.extended_release_version,
        uuids: showAllToggle ? undefined : [...selectedRedHatRepos],
      },
      sortString(),
      [ContentOrigin.REDHAT],
      true,
      false,
      { keepPreviousData: false, staleTime: 0 },
    );

  const {
    data: contentList = [],
    meta: { count = 0 },
  } = data;

  const countIsZero = count === 0;

  return (
    <Grid hasGutter>
      <Flex
        direction={{ default: 'row' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
      >
        <Title ouiaId='additional_red_hat_repositories' headingLevel='h1'>
          Additional Red Hat repositories
        </Title>
      </Flex>
      <Flex direction={{ default: 'row' }}>
        <Hide hide={countIsZero}>
          <Content component={ContentVariants.p}>
            Core repositories for your release version are already included.{' '}
            {contentList.length - redHatCoreRepos.size > 0
              ? 'Select additional Red Hat repositories below.'
              : ''}
          </Content>
        </Hide>
      </Flex>
      <Hide hide={(countIsZero && !searchQuery) || isLoading}>
        <Flex className={classes.topBottomContainers}>
          <Flex>
            <FlexItem>
              <InputGroup>
                <InputGroupItem isFill>
                  <TextInput
                    isDisabled={isLoading}
                    id='name'
                    ouiaId='filter_name'
                    placeholder='Filter by name'
                    value={searchQuery}
                    onChange={(_event, value) => setSearchQuery(value)}
                    type='search'
                    customIcon={<SearchIcon />}
                  />
                </InputGroupItem>
              </InputGroup>
            </FlexItem>
            <Hide hide={countIsZero}>
              <FlexItem>
                <ToggleGroup aria-label='Default with single selectable'>
                  <ToggleGroupItem
                    text='All'
                    buttonId='redhat-repositories-toggle-button'
                    data-ouia-component-id='all-selected-repositories-toggle'
                    isSelected={showAllToggle}
                    onChange={() => setShowAllToggle(true)}
                  />
                  <ToggleGroupItem
                    text='Selected'
                    buttonId='redhat-repositories-selected-toggle-button'
                    data-ouia-component-id='redhat-selected-repositories-toggle'
                    isSelected={!showAllToggle}
                    isDisabled={hasOnlyCoreRepos}
                    onChange={() => setShowAllToggle(false)}
                  />
                </ToggleGroup>
              </FlexItem>
            </Hide>
          </Flex>
          <Hide hide={countIsZero}>
            <FlexItem>
              <Pagination
                id='top-pagination-id'
                widgetId='topPaginationWidgetId'
                isDisabled={isLoading}
                itemCount={count}
                perPage={perPage}
                page={page}
                onSetPage={onSetPage}
                isCompact
                onPerPageSelect={onPerPageSelect}
              />
            </FlexItem>
          </Hide>
        </Flex>
      </Hide>
      {countIsZero ? (
        <Bullseye data-ouia-component-id='redhat_repositories_table'>
          <EmptyTableState
            notFiltered={searchQuery === ''}
            clearFilters={() => setSearchQuery('')}
            itemName='Red Hat repositories'
            notFilteredBody='No Red Hat repositories match the release version and architecture'
          />
        </Bullseye>
      ) : (
        <>
          <Hide hide={!isLoading}>
            <Grid className=''>
              <SkeletonTable
                rows={perPage}
                columnsCount={columnHeaders.length}
                variant={TableVariant.compact}
              />
            </Grid>
          </Hide>
          <Hide hide={countIsZero || isLoading}>
            <Table
              aria-label='Redhat repositories table'
              ouiaId='redhat_repositories_table'
              variant='compact'
            >
              <Thead>
                <Tr>
                  <Th screenReaderText='empty' />
                  {columnHeaders.map((columnHeader, index) => (
                    <Th key={columnHeader + 'column'} sort={sortParams(index)}>
                      {columnHeader}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {contentList.map((rowData: ContentItem, rowIndex) => {
                  const { uuid, name, url } = rowData;
                  return (
                    <Tr key={uuid}>
                      <TdWithTooltip
                        show={
                          !(rowData.snapshot && rowData.last_snapshot_uuid) ||
                          redHatCoreRepos.has(uuid)
                        }
                        tooltipProps={{
                          content: redHatCoreRepos.has(uuid)
                            ? 'This item is pre-selected for the chosen architecture and release version.'
                            : 'A snapshot is not yet available for this repository.',
                        }}
                        select={{
                          rowIndex,
                          onSelect: () => handleRepoSelection(uuid),
                          isSelected: selectedRedHatRepos.has(uuid),
                          isDisabled:
                            !(rowData.snapshot && rowData.last_snapshot_uuid) ||
                            redHatCoreRepos.has(uuid),
                        }}
                      />
                      <Td>
                        <ConditionalTooltip show={name.length > 60} content={name}>
                          <>{reduceStringToCharsWithEllipsis(name, 60)}</>
                        </ConditionalTooltip>
                        <ConditionalTooltip show={url.length > 50} content={url}>
                          <UrlWithExternalIcon
                            href={url}
                            customText={reduceStringToCharsWithEllipsis(url)}
                          />
                        </ConditionalTooltip>
                      </Td>
                      {/* <Td>{rowData.label || '-'}</Td> */}
                      <Td>{rowData.last_snapshot?.content_counts?.['rpm.advisory'] || '-'}</Td>
                      <Td>
                        <PackageCount
                          rowData={rowData}
                          href={pathname + '/' + REPOSITORIES_ROUTE + `/${rowData.uuid}/packages`}
                          opensNewTab
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
            <Hide hide={countIsZero}>
              <Flex className={classes.topBottomContainers}>
                <FlexItem />
                <FlexItem>
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
                </FlexItem>
              </Flex>
            </Hide>
          </Hide>
        </>
      )}
    </Grid>
  );
}
