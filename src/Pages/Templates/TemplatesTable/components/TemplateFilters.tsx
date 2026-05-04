import { useEffect, useMemo, useState } from 'react';
import {
  Label,
  LabelGroup,
  Button,
  Flex,
  FlexItem,
  InputGroup,
  TextInput,
  InputGroupItem,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
  TreeView,
  TreeViewDataItem,
} from '@patternfly/react-core';

import { FilterIcon, SearchIcon } from '@patternfly/react-icons';
import Hide from 'components/Hide/Hide';
import { NameLabel, RepositoryParamsResponse } from 'services/Content/ContentApi';
import { useQueryClient } from '@tanstack/react-query';
import { REPOSITORY_PARAMS_KEY } from 'services/Content/ContentQueries';
import useDebounce from 'Hooks/useDebounce';
import { createUseStyles } from 'react-jss';
import { isEmpty } from 'lodash';
import { useAppContext } from 'middleware/AppContext';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';
import { useNavigate } from 'react-router-dom';
import { TemplateFilterData } from 'services/Templates/TemplateApi';
import { STANDARD_STREAM } from '../constants';

interface Props {
  isLoading?: boolean;
  setFilterData: (filterData: TemplateFilterData) => void;
  filterData: TemplateFilterData;
}

const useStyles = createUseStyles({
  chipsContainer: {
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

export type Filters = 'Name' | 'Operating system' | 'Architecture' | 'Release stream';

const Filters = ({ isLoading, setFilterData, filterData }: Props) => {
  const classes = useStyles();
  const { rbac, subscriptions } = useAppContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isActionOpen, setActionOpen] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const filters = ['Name', 'Operating system', 'Architecture', 'Release stream'];
  const [filterType, setFilterType] = useState<Filters>('Name');
  const [versionNamesLabels, setVersionNamesLabels] = useState({});
  const [archNamesLabels, setArchNamesLabels] = useState({});
  const [streamNamesLabels, setStreamNamesLabels] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArch, setSelectedArch] = useState<string>('');
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const {
    distribution_arches = [],
    distribution_versions = [],
    distribution_minor_versions = [],
    extended_release_streams = [],
  } = queryClient.getQueryData<RepositoryParamsResponse>([REPOSITORY_PARAMS_KEY]) || {};

  const hasRHELSubscription = !!subscriptions?.red_hat_enterprise_linux;
  const isMissingRequirements = !rbac?.templateWrite || !hasRHELSubscription;
  const missingRequirements =
    rbac?.templateWrite && !hasRHELSubscription ? 'subscription (RHEL)' : 'permission';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedArch('');
    setSelectedStreams([]);
    setSelectedVersions([]);
    setFilterData({
      search: '',
      version: [],
      extended_release_version: [],
      restrict_to_major: false,
      arch: '',
      repository_uuids: '',
      snapshot_uuids: '',
      extended_release: [],
    });
  };

  useEffect(() => {
    // If the filters get cleared at the top level, sense that and clear them here.
    if (
      !filterData.arch &&
      filterData.version.length === 0 &&
      !filterData.search &&
      filterData.extended_release.length === 0
    ) {
      clearFilters();
    }
  }, [
    filterData.arch,
    filterData.version.length,
    filterData.search,
    filterData.extended_release.length,
  ]);

  const {
    searchQuery: debouncedSearchQuery,
    selectedArch: debouncedSelectedArch,
    selectedStreams: debouncedSelectedStreams,
    selectedVersions: debouncedSelectedVersions,
  } = useDebounce({
    searchQuery,
    selectedArch,
    selectedStreams,
    selectedVersions,
  });

  const getLabels = (type: 'arch' | 'version' | 'extended_release', name: string): string => {
    if (type === 'extended_release' && name === STANDARD_STREAM.name) {
      return 'none';
    }

    let namesLabels: NameLabel[];
    if (type === 'arch') {
      namesLabels = distribution_arches;
    } else if (type === 'version') {
      namesLabels = [...distribution_versions, ...distribution_minor_versions];
    } else {
      namesLabels = extended_release_streams;
    }

    const found = namesLabels.find((v) => v.name === name);
    if (found) {
      return found.label;
    }
    return name;
  };

  useEffect(() => {
    const majorVersionNames = new Set(distribution_versions.map((v) => v.name));
    const hasMajorSelected = debouncedSelectedVersions.some((v) => majorVersionNames.has(v));

    setFilterData({
      search: debouncedSearchQuery,
      version: debouncedSelectedVersions.map((version) => getLabels('version', version)),
      arch: getLabels('arch', debouncedSelectedArch),
      extended_release_version: [],
      restrict_to_major: hasMajorSelected,
      repository_uuids: '',
      snapshot_uuids: '',
      extended_release: debouncedSelectedStreams.map((stream) =>
        getLabels('extended_release', stream),
      ),
    });
  }, [
    debouncedSearchQuery,
    debouncedSelectedArch,
    debouncedSelectedStreams,
    debouncedSelectedVersions,
  ]);

  useEffect(() => {
    if (isEmpty(archNamesLabels) && distribution_arches.length !== 0) {
      const arches = {};
      distribution_arches.forEach((arch) => (arches[arch.name] = arch.label));
      setArchNamesLabels(arches);
    }

    if (
      isEmpty(versionNamesLabels) &&
      (distribution_versions.length !== 0 || distribution_minor_versions.length !== 0)
    ) {
      const versions = {};
      distribution_versions.forEach((major) => {
        versions[major.name] = major.label;
      });
      distribution_minor_versions.forEach((minor) => {
        versions[minor.name] = minor.label;
      });
      setVersionNamesLabels(versions);
    }

    if (isEmpty(streamNamesLabels) && extended_release_streams.length !== 0) {
      const streams = {};
      extended_release_streams.forEach((stream) => (streams[stream.name] = stream.label));
      streams[STANDARD_STREAM.name] = STANDARD_STREAM.label;
      setStreamNamesLabels(streams);
    }
  }, [
    distribution_arches,
    distribution_versions,
    distribution_minor_versions,
    extended_release_streams,
    archNamesLabels,
    streamNamesLabels,
    versionNamesLabels,
  ]);

  const versionGroups = useMemo(
    () =>
      distribution_versions
        .filter((major) => major.name !== 'Any' && major.name !== 'RHEL 7')
        .reverse()
        .map((major) => ({
          majorName: major.name,
          group: `${major.name}.x`,
          minors: distribution_minor_versions
            .filter((minor) => minor.major === major.label)
            .map((minor) => ({
              minorName: minor.name,
            })),
        })),
    [distribution_versions, distribution_minor_versions],
  );

  const versionTree = useMemo<TreeViewDataItem[]>(
    () =>
      versionGroups.flatMap((group) => [
        {
          id: group.majorName,
          name: group.majorName,
          checkProps: {
            checked: selectedVersions.includes(group.majorName),
          },
        },
        {
          id: group.group,
          name: group.group,
          checkProps: {
            checked:
              group.minors.length > 0 &&
              group.minors.every((minor) => selectedVersions.includes(minor.minorName)),
          },
          children: group.minors.map((minor) => ({
            id: minor.minorName,
            name: minor.minorName,
            checkProps: {
              checked: selectedVersions.includes(minor.minorName),
            },
          })),
          defaultExpanded: true,
        },
      ]),
    [versionGroups, selectedVersions],
  );

  const onVersionCheck = (event: React.ChangeEvent, item: TreeViewDataItem) => {
    const checked = (event?.target as HTMLInputElement).checked;
    const itemID = item.id as string; // RHEL 8, RHEL 8.x, RHEL 8.8 etc

    // if selected item is a parent (e.g. RHEL 8.x), either add or remove all minors in its group
    const group = versionGroups.find((g) => g.group === itemID);
    if (group) {
      const minors = group.minors.map((minor) => minor.minorName);
      setSelectedVersions((prev) => {
        if (checked) {
          return [...new Set([...prev, ...minors])];
        }
        return prev.filter((value) => !minors.includes(value));
      });
      return;
    }

    // otherwise just add or remove item
    setSelectedVersions((prev) => {
      if (checked) {
        if (prev.includes(itemID)) {
          return prev;
        }
        return [...new Set([...prev, itemID])];
      }
      return prev.filter((item) => item !== itemID);
    });
  };

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
              type='search'
              customIcon={<SearchIcon />}
            />
          </InputGroupItem>
        );
      case 'Operating system':
        return (
          <Dropdown
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                aria-label='filter operating system'
                id='versionSelect'
                ouiaId='filter_by_version'
                onClick={() => setActionOpen((prev) => !prev)}
                isDisabled={isLoading}
                isExpanded={isActionOpen}
              >
                Filter by operating system
              </MenuToggle>
            )}
            onOpenChange={(isOpen) => setActionOpen(isOpen)}
            isOpen={isActionOpen}
          >
            <TreeView data={versionTree} onCheck={onVersionCheck} hasCheckboxes />
          </Dropdown>
        );

      case 'Architecture':
        return (
          <Dropdown
            onSelect={(_, val) => {
              setSelectedArch(val as string);
              setActionOpen(false);
            }}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                aria-label='filter architecture'
                id='architectureSelect'
                ouiaId='filter_by_architecture'
                onClick={() => setActionOpen((prev) => !prev)}
                isDisabled={isLoading}
                isExpanded={isActionOpen}
              >
                {selectedArch || 'Filter by architecture'}
              </MenuToggle>
            )}
            onOpenChange={(isOpen) => setActionOpen(isOpen)}
            isOpen={isActionOpen}
          >
            <DropdownList>
              {Object.keys(archNamesLabels).map((architecture) => (
                <DropdownItem
                  key={`arch_${architecture}`}
                  value={architecture}
                  isSelected={selectedArch === architecture}
                  component='button'
                  data-ouia-component-id={`filter_${architecture}`}
                >
                  {architecture}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        );
      case 'Release stream':
        return (
          <Dropdown
            onSelect={(_, val) => {
              setSelectedStreams((prev) =>
                prev.includes(val as string)
                  ? prev.filter((item) => item !== (val as string))
                  : [...new Set([...prev, val as string])],
              );
            }}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                aria-label='filter stream'
                id='streamSelect'
                ouiaId='filter_by_stream'
                onClick={() => setActionOpen((prev) => !prev)}
                isDisabled={isLoading}
                isExpanded={isActionOpen}
              >
                Filter by release stream
              </MenuToggle>
            )}
            onOpenChange={(isOpen) => setActionOpen(isOpen)}
            isOpen={isActionOpen}
          >
            <DropdownList>
              {Object.keys(streamNamesLabels).map((stream) => (
                <DropdownItem
                  key={`stream_${stream}`}
                  value={stream}
                  isSelected={selectedStreams.includes(stream)}
                  component='button'
                  data-ouia-component-id={`filter_${stream}`}
                  hasCheckbox
                >
                  {stream}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        );
      default:
        return <></>;
    }
  }, [
    filterType,
    isLoading,
    searchQuery,
    archNamesLabels,
    selectedArch,
    isActionOpen,
    selectedStreams,
    streamNamesLabels,
    selectedVersions,
    versionGroups,
  ]);

  return (
    <Flex direction={{ default: 'column' }}>
      <Flex>
        <FlexItem>
          <InputGroup>
            <InputGroupItem>
              <FlexItem>
                <Dropdown
                  key='filtertype'
                  onSelect={(_, val) => {
                    setFilterType(val as Filters);
                    setTypeFilterOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      icon={<FilterIcon />}
                      ref={toggleRef}
                      aria-label='filterSelectionDropdown'
                      id='filterSelectionDropdown'
                      ouiaId='filter_type_toggle'
                      onClick={() => setTypeFilterOpen((prev) => !prev)}
                      isDisabled={isLoading}
                      isExpanded={typeFilterOpen}
                    >
                      {filterType}
                    </MenuToggle>
                  )}
                  onOpenChange={(isOpen) => setTypeFilterOpen(isOpen)}
                  isOpen={typeFilterOpen}
                  ouiaId='filter_type'
                >
                  <DropdownList>
                    {filters.map((filter) => (
                      <DropdownItem
                        key={filter}
                        value={filter}
                        isSelected={filterType === filter}
                        component='button'
                        data-ouia-component-id={`filter_${filter}`}
                      >
                        {filter}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
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
              onClick={() => navigate('add', { state: { from: 'table' } })}
            >
              Create template
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
      <Hide
        hide={
          !(
            selectedArch ||
            searchQuery ||
            selectedStreams?.length > 0 ||
            selectedVersions?.length > 0
          )
        }
      >
        <FlexItem className={classes.chipsContainer}>
          <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
            {selectedVersions.length > 0 && (
              <LabelGroup categoryName='Operating system'>
                {selectedVersions.map((version) => (
                  <Label
                    variant='filled'
                    key={version}
                    onClose={() => {
                      setSelectedVersions((prev) => prev.filter((item) => item !== version));
                    }}
                  >
                    {version}
                  </Label>
                ))}
              </LabelGroup>
            )}
            {selectedArch ? (
              <LabelGroup categoryName='Architecture'>
                <Label variant='filled' key={selectedArch} onClose={() => setSelectedArch('')}>
                  {selectedArch}
                </Label>
              </LabelGroup>
            ) : (
              <></>
            )}
            {searchQuery && (
              <LabelGroup categoryName='Name'>
                <Label variant='filled' key='name_chip' onClose={() => setSearchQuery('')}>
                  {searchQuery}
                </Label>
              </LabelGroup>
            )}
            {selectedStreams.length > 0 && (
              <LabelGroup categoryName='Release stream'>
                {selectedStreams.map((stream) => (
                  <Label
                    variant='filled'
                    key={stream}
                    onClose={() => {
                      setSelectedStreams((prev) => prev.filter((item) => item !== stream));
                    }}
                  >
                    {stream}
                  </Label>
                ))}
              </LabelGroup>
            )}
            {((debouncedSearchQuery && searchQuery) ||
              selectedVersions?.length > 0 ||
              !!selectedArch ||
              selectedStreams?.length > 0) && (
              <Button
                className={classes.clearFilters}
                onClick={clearFilters}
                variant='link'
                isInline
              >
                Clear filters
              </Button>
            )}
          </Flex>
        </FlexItem>
      </Hide>
    </Flex>
  );
};

export default Filters;
