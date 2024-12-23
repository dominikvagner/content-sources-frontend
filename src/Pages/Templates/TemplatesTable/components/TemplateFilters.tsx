import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Chip,
  ChipGroup,
  Flex,
  FlexItem,
  InputGroup,
  TextInput,
  InputGroupItem,
  InputGroupText,
} from '@patternfly/react-core';
import { FilterIcon, SearchIcon } from '@patternfly/react-icons';
import { global_BackgroundColor_100 } from '@patternfly/react-tokens';
import Hide from 'components/Hide/Hide';
import { RepositoryParamsResponse } from 'services/Content/ContentApi';
import { useQueryClient } from 'react-query';
import { REPOSITORY_PARAMS_KEY } from 'services/Content/ContentQueries';
import useDebounce from 'Hooks/useDebounce';
import { createUseStyles } from 'react-jss';
import { isEmpty } from 'lodash';
import { useAppContext } from 'middleware/AppContext';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';
import { useNavigate } from 'react-router-dom';
import { TemplateFilterData } from 'services/Templates/TemplateApi';
import DropdownSelect from 'components/DropdownSelect/DropdownSelect';

interface Props {
  isLoading?: boolean;
  setFilterData: (filterData: TemplateFilterData) => void;
  filterData: TemplateFilterData;
}

const useStyles = createUseStyles({
  chipsContainer: {
    backgroundColor: global_BackgroundColor_100.value,
    paddingTop: '16px',
  },
  clearFilters: {
    marginLeft: '16px',
  },
  // Needed to fix styling when "Add repositories" button is disabled
  repositoryActions: {
    display: 'flex',
    flexDirection: 'row',
  },
});

export type Filters = 'Name' | 'Version' | 'Architecture';

const Filters = ({ isLoading, setFilterData, filterData }: Props) => {
  const classes = useStyles();
  const { rbac, subscriptions } = useAppContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const filters = ['Name', 'Version', 'Architecture'];
  const [filterType, setFilterType] = useState<Filters>('Name');
  const [versionNamesLabels, setVersionNamesLabels] = useState({});
  const [archNamesLabels, setArchNamesLabels] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedArch, setSelectedArch] = useState<string>('');

  const { distribution_arches = [], distribution_versions = [] } =
    queryClient.getQueryData<RepositoryParamsResponse>(REPOSITORY_PARAMS_KEY) || {};

  const hasRHELSubscription = !!subscriptions?.red_hat_enterprise_linux;
  const isMissingRequirements = !rbac?.templateWrite || !hasRHELSubscription;
  const missingRequirements =
    rbac?.templateWrite && !hasRHELSubscription ? 'subscription (RHEL)' : 'permission';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedVersion('');
    setSelectedArch('');
    setFilterData({ search: '', version: '', arch: '', repository_uuids: '', snapshot_uuids: '' });
  };

  useEffect(() => {
    // If the filters get cleared at the top level, sense that and clear them here.
    if (!filterData.arch && !filterData.version && !filterData.search) {
      clearFilters();
    }
  }, [filterData.arch, filterData.version, filterData.search]);

  const {
    searchQuery: debouncedSearchQuery,
    selectedVersion: debouncedSelectedVersion,
    selectedArch: debouncedSelectedArch,
  } = useDebounce({
    searchQuery,
    selectedVersion,
    selectedArch,
  });

  const getLabels = (type: 'arch' | 'version', name: string): string => {
    const namesLabels = type === 'arch' ? distribution_arches : distribution_versions;
    const found = namesLabels.find((v) => v.name === name);
    if (found) {
      return found.label;
    }
    return name;
  };

  useEffect(() => {
    setFilterData({
      search: debouncedSearchQuery,
      version: getLabels('version', debouncedSelectedVersion),
      arch: getLabels('arch', debouncedSelectedArch),
      repository_uuids: '',
      snapshot_uuids: '',
    });
  }, [debouncedSearchQuery, debouncedSelectedVersion, debouncedSelectedArch]);

  useEffect(() => {
    if (
      isEmpty(versionNamesLabels) &&
      isEmpty(archNamesLabels) &&
      distribution_arches.length !== 0 &&
      distribution_versions.length !== 0
    ) {
      const arches = {};
      const versions = {};
      distribution_arches.forEach((arch) => (arches[arch.name] = arch.label));
      distribution_versions.forEach((version) => (versions[version.name] = version.label));
      setVersionNamesLabels(versions);
      setArchNamesLabels(arches);
    }
  }, [distribution_arches, distribution_versions]);

  const Filter = useMemo(() => {
    switch (filterType) {
      case 'Name':
        return (
          <InputGroupItem isFill>
            <TextInput
              isDisabled={isLoading}
              id='name'
              ouiaId='filter_by_name'
              placeholder='Filter by name'
              value={searchQuery}
              onChange={(_event, value) => setSearchQuery(value)}
            />
            <InputGroupText isDisabled={isLoading} id='search-icon'>
              <SearchIcon />
            </InputGroupText>
          </InputGroupItem>
        );
      case 'Version':
        return (
          <DropdownSelect
            onSelect={(_, val) => setSelectedVersion(val as string)}
            menuToggleProps={{
              'aria-label': 'filter version',
              id: 'versionSelect',
            }}
            dropDownItems={Object.keys(versionNamesLabels).map((version) => ({
              value: version,
              isSelected: selectedVersion === version,
              children: version,
              'data-ouia-component-id': `filter_${version}`,
            }))}
            isDisabled={isLoading}
            menuValue={selectedVersion || 'Filter by version'}
            ouiaId='filter_version'
          />
        );
      case 'Architecture':
        return (
          <DropdownSelect
            onSelect={(_, val) => setSelectedArch(val as string)}
            menuToggleProps={{
              'aria-label': 'filter architecture',
              id: 'archSelect',
            }}
            dropDownItems={Object.keys(archNamesLabels).map((arch) => ({
              value: arch,
              isSelected: selectedArch === arch,
              children: arch,
              'data-ouia-component-id': `filter_${arch}`,
            }))}
            isDisabled={isLoading}
            menuValue={selectedArch || 'Filter by architecture'}
            ouiaId='filter_architecture'
          />
        );
      default:
        return <></>;
    }
  }, [
    filterType,
    isLoading,
    searchQuery,
    versionNamesLabels,
    selectedVersion,
    archNamesLabels,
    selectedArch,
  ]);

  return (
    <Flex direction={{ default: 'column' }}>
      <Flex>
        <FlexItem>
          <InputGroup>
            <InputGroupItem>
              <FlexItem>
                <DropdownSelect
                  onSelect={(_, val) => setFilterType(val as Filters)}
                  menuToggleProps={{
                    'aria-label': 'filterSelectionDropdown',
                    id: 'typeSelect',
                    icon: <FilterIcon />,
                  }}
                  dropDownItems={filters.map((filter) => ({
                    value: filter,
                    isSelected: filterType === filter,
                    children: filter,
                    'data-ouia-component-id': `filter_${filter}`,
                  }))}
                  isDisabled={isLoading}
                  menuValue={filterType}
                  ouiaId='filter_type'
                />
              </FlexItem>
            </InputGroupItem>
            <InputGroupItem>
              <FlexItem>{Filter}</FlexItem>
            </InputGroupItem>
          </InputGroup>
        </FlexItem>
        <FlexItem className={classes.repositoryActions}>
          <ConditionalTooltip
            content={`You do not have the required ${missingRequirements} to perform this action.`}
            show={isMissingRequirements}
            setDisabled
          >
            <Button
              id='createContentTemplateButton'
              ouiaId='create_content_template'
              variant='primary'
              isDisabled={isLoading}
              onClick={() => navigate('add')}
            >
              Add content template
            </Button>
          </ConditionalTooltip>
          {/* 
          BULK DELETE CODE
          <ConditionalTooltip
          content='You do not have the required permissions to perform this action.'
          show={!rbac?.write && !isRedHatRepository}
          setDisabled
        >
          <DeleteKebab
            isDisabled={!rbac.templateWrite && isRedHatRepository}
            atLeastOneRepoChecked={atLeastOneRepoChecked}
            numberOfReposChecked={numberOfReposChecked}
            deleteCheckedRepos={deleteCheckedRepos}
            toggleOuiaId='custom_repositories_kebab_toggle'
          />
        </ConditionalTooltip> */}
        </FlexItem>
      </Flex>
      <Hide hide={!(selectedVersion || selectedArch || searchQuery)}>
        <FlexItem className={classes.chipsContainer}>
          {selectedVersion ? (
            <ChipGroup categoryName='Version'>
              <Chip key={selectedVersion} onClick={() => setSelectedVersion('')}>
                {selectedVersion}
              </Chip>
            </ChipGroup>
          ) : (
            <></>
          )}
          {selectedArch ? (
            <ChipGroup categoryName='Architecture'>
              <Chip key={selectedArch} onClick={() => setSelectedArch('')}>
                {selectedArch}
              </Chip>
            </ChipGroup>
          ) : (
            <></>
          )}
          {searchQuery && (
            <ChipGroup categoryName='Name'>
              <Chip key='name_chip' onClick={() => setSearchQuery('')}>
                {searchQuery}
              </Chip>
            </ChipGroup>
          )}
          {((debouncedSearchQuery && searchQuery) || !!selectedVersion || !!selectedArch) && (
            <Button className={classes.clearFilters} onClick={clearFilters} variant='link' isInline>
              Clear filters
            </Button>
          )}
        </FlexItem>
      </Hide>
    </Flex>
  );
};

export default Filters;
