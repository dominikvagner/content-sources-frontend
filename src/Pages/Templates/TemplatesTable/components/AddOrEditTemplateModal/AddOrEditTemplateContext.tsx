import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TemplateRequest } from 'services/Templates/TemplateApi';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useContentListQuery, useRepositoryParams } from 'services/Content/ContentQueries';
import {
  ContentOrigin,
  NameLabel,
  DistributionMinorVersion,
  ExtendedReleaseStream,
} from 'services/Content/ContentApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFetchTemplate, useTemplateNameAvailability } from 'services/Templates/TemplateQueries';
import useRootPath from 'Hooks/useRootPath';
import { formatDateForPicker, isDateValid } from 'helpers';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import useDebounce from 'Hooks/useDebounce';
import { getRedHatCoreRepoUrls, isExtendedSupportTemplate } from '../../helpers';
import { STANDARD_STREAM } from '../../constants';
import { useAppContext } from 'middleware/AppContext';

export interface AddOrEditTemplateContextInterface {
  queryClient: QueryClient;
  distribution_arches: NameLabel[];
  distribution_versions: NameLabel[];
  extended_release_streams: Array<ExtendedReleaseStream>;
  distribution_minor_versions: DistributionMinorVersion[];
  templateRequest: Partial<TemplateRequest>;
  setTemplateRequest: (value: React.SetStateAction<Partial<TemplateRequest>>) => void;
  selectedRedHatRepos: Set<string>;
  setSelectedRedHatRepos: (uuidSet: Set<string>) => void;
  selectedCustomRepos: Set<string>;
  setSelectedCustomRepos: (uuidSet: Set<string>) => void;
  redHatCoreRepos: Set<string>;
  hasInvalidSteps: (index: number) => boolean;
  /** False while fetching and merging an existing template (edit / copy). Always true for add flow. */
  isSourceTemplateReady: boolean;
  isNameTaken: boolean;
  isNameCheckPending: boolean;
  isExtendedSupportAvailable: boolean;
  isEdit?: boolean;
  isCopy?: boolean;
  editUUID?: string;
}

export const AddOrEditTemplateContext = createContext({} as AddOrEditTemplateContextInterface);

export const AddOrEditTemplateContextProvider = ({ children }: { children: ReactNode }) => {
  const uuid = useSafeUUIDParam('templateUUID');
  const {
    data: editTemplateData,
    isError,
    isSuccess: isTemplateQuerySuccess,
  } = useFetchTemplate(uuid, !!uuid);

  const location = useLocation();
  const isCopy = location.pathname.includes('/copy');
  const isEdit = !!uuid && !isCopy;

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const rootPath = useRootPath();

  if (isError) navigate(rootPath);

  const [templateRequest, setTemplateRequest] = useState<Partial<TemplateRequest>>({
    extended_release: STANDARD_STREAM.label,
    extended_release_version: '',
  });

  const [redHatCoreRepos, setRedHatCoreRepos] = useState<Set<string>>(new Set());
  const [selectedRedHatRepos, setSelectedRedHatRepos] = useState<Set<string>>(new Set());
  const [selectedCustomRepos, setSelectedCustomRepos] = useState<Set<string>>(new Set());
  const [isSourceTemplateReady, setIsSourceTemplateReady] = useState(!uuid);

  const hasLoadedEditData = useRef(false);
  const lastLoadedMinorVersion = useRef<string | undefined>();

  const {
    data: {
      distribution_versions = [],
      distribution_arches = [],
      distribution_minor_versions = [],
      extended_release_streams: extendedReleaseStreamsRaw = [],
    } = {},
  } = useRepositoryParams();

  // Filter streams to only include those with at least one entitled architecture
  const extended_release_streams = useMemo(
    () =>
      extendedReleaseStreamsRaw.filter((stream) =>
        stream.architectures?.some((arch) => arch.entitled),
      ),
    [extendedReleaseStreamsRaw],
  );

  const { arch, version, extended_release, extended_release_version } = templateRequest;

  const { features } = useAppContext();
  const isExtendedSupportAvailable = !!(
    features?.extendedreleaserepos?.enabled &&
    features.extendedreleaserepos?.accessible &&
    extended_release_streams.length > 0
  );

  const usesExtendedSupportStream =
    isExtendedSupportAvailable &&
    isExtendedSupportTemplate(extended_release, extended_release_version);

  const debouncedName = useDebounce(templateRequest.name?.trim() ?? '', 400);
  const nameCheckEnabled = debouncedName.length > 0 && debouncedName.length <= 255;
  const {
    isNameTaken,
    isFetching: isNameCheckPending,
    isFetched: isNameCheckFetched,
  } = useTemplateNameAvailability(debouncedName, isEdit ? uuid : undefined);

  // Step validation //

  const stepValidationSequence = useMemo(() => {
    const { arch, date, version, use_latest, extended_release_version } = templateRequest;
    const isPlatformDefined = arch && version;
    const isNameFormatValid = debouncedName.length > 0 && debouncedName.length <= 255;
    const isNameCheckComplete = !nameCheckEnabled || (isNameCheckFetched && !isNameCheckPending);
    const isNameUnique = !isNameTaken;

    return [
      true, // [0] No step
      usesExtendedSupportStream ? isPlatformDefined && extended_release_version : isPlatformDefined, // [1] "OS and architecture" step
      !!selectedRedHatRepos.size, // [2] "Red Hat repositories" step
      true, // [3] "Other repositories" step - optional step
      use_latest || isDateValid(date ? formatDateForPicker(date) : ''), // [4] "Setup date" step
      isNameFormatValid && isNameUnique && isNameCheckComplete, // [5] "Detail" step
    ] as boolean[];
  }, [
    templateRequest,
    selectedRedHatRepos.size,
    usesExtendedSupportStream,
    debouncedName,
    nameCheckEnabled,
    isNameTaken,
    isNameCheckFetched,
    isNameCheckPending,
  ]);

  const hasInvalidSteps = useCallback(
    (stepIndex: number) => {
      const stepsToCheck = stepValidationSequence.slice(0, stepIndex + 1);
      return !stepsToCheck.every((step) => step);
    },
    [selectedRedHatRepos.size, stepValidationSequence],
  );

  // Template creation and editing //

  useEffect(() => {
    if (!uuid && arch && version) setSelectedCustomRepos(new Set());
  }, [uuid, arch, version, extended_release, extended_release_version]);

  const coreRepoURLs = useMemo(
    () => getRedHatCoreRepoUrls(arch, version, extended_release, extended_release_version),
    [arch, version, extended_release, extended_release_version],
  );

  const { data: coreRepos } = useContentListQuery(
    1,
    10,
    { urls: coreRepoURLs },
    '',
    [ContentOrigin.REDHAT],
    coreRepoURLs.length > 0,
    false,
    { placeholderData: undefined, staleTime: 0 },
  );

  useEffect(() => {
    if (coreRepos?.data?.length) {
      const coreRepoUUIDs = new Set(coreRepos?.data.map((repo) => repo.uuid));
      setRedHatCoreRepos(new Set(coreRepoUUIDs));

      const didMinorVersionChange =
        usesExtendedSupportStream &&
        lastLoadedMinorVersion.current !== undefined &&
        extended_release_version !== lastLoadedMinorVersion.current;

      // Pre-select core repos if we're creating a new template OR the user edits the minor version
      if (!uuid || didMinorVersionChange) {
        setSelectedRedHatRepos(new Set(coreRepoUUIDs));
        if (didMinorVersionChange) lastLoadedMinorVersion.current = extended_release_version;
      }
    }
  }, [coreRepos?.data, uuid, extended_release_version]);

  const { data: existingRepositoryInformation, isLoading: isReposQueryLoading } =
    useContentListQuery(
      1,
      10,
      { uuids: editTemplateData?.repository_uuids },
      '',
      [ContentOrigin.ALL],
      !!uuid && !!editTemplateData?.repository_uuids.length,
    );

  // Hydrate wizard state when editing/copying — block the wizard until done so step validation/nav match loaded data.
  useEffect(() => {
    if (!uuid) {
      setIsSourceTemplateReady(true);
      return;
    }

    if (isError) {
      // Exit the loading state when the query has errored so the UI
      // doesn't stay in a perpetual "loading" spinner state.
      setIsSourceTemplateReady(true);
      return;
    }

    if (!isTemplateQuerySuccess || !editTemplateData) {
      setIsSourceTemplateReady(false);
      return;
    }

    if (hasLoadedEditData.current) {
      setIsSourceTemplateReady(true);
      return;
    }

    const repoUuidList = editTemplateData.repository_uuids ?? [];

    if (repoUuidList.length === 0) {
      const { extended_release, extended_release_version } = editTemplateData;

      if (extended_release && extended_release_version) {
        lastLoadedMinorVersion.current = extended_release_version;
      }

      setTemplateRequest({
        ...editTemplateData,
        extended_release: extended_release || STANDARD_STREAM.label,
      });
      setSelectedRedHatRepos(new Set());
      setSelectedCustomRepos(new Set());
      hasLoadedEditData.current = true;
      setIsSourceTemplateReady(true);
      return;
    }

    if (isReposQueryLoading || !existingRepositoryInformation) {
      setIsSourceTemplateReady(false);
      return;
    }

    const { extended_release, extended_release_version } = editTemplateData;

    if (extended_release && extended_release_version) {
      lastLoadedMinorVersion.current = extended_release_version;
    }

    setTemplateRequest({
      ...editTemplateData,
      extended_release: extended_release || STANDARD_STREAM.label,
    });

    const redHatReposToAdd: string[] = [];
    const customReposToAdd: string[] = [];

    for (const item of existingRepositoryInformation.data ?? []) {
      if (item.org_id === '-1') {
        redHatReposToAdd.push(item.uuid);
      } else {
        customReposToAdd.push(item.uuid);
      }
    }

    setSelectedRedHatRepos(new Set(redHatReposToAdd));
    setSelectedCustomRepos(new Set(customReposToAdd));

    hasLoadedEditData.current = true;
    setIsSourceTemplateReady(true);
  }, [
    uuid,
    editTemplateData,
    isReposQueryLoading,
    isTemplateQuerySuccess,
    existingRepositoryInformation,
  ]);

  const templateRequestDependencies = useMemo(
    () => [...selectedCustomRepos, ...selectedRedHatRepos],
    [selectedCustomRepos, selectedRedHatRepos],
  );

  useEffect(() => {
    setTemplateRequest((prev) => ({
      ...prev,
      repository_uuids: [...selectedRedHatRepos, ...selectedCustomRepos],
    }));
  }, [templateRequestDependencies]);

  return (
    <AddOrEditTemplateContext.Provider
      key={uuid}
      value={{
        queryClient,
        distribution_arches,
        distribution_versions,
        extended_release_streams,
        distribution_minor_versions,
        templateRequest,
        setTemplateRequest,
        selectedRedHatRepos,
        setSelectedRedHatRepos,
        selectedCustomRepos,
        setSelectedCustomRepos,
        redHatCoreRepos,
        hasInvalidSteps,
        isSourceTemplateReady,
        isNameTaken,
        isNameCheckPending: nameCheckEnabled && isNameCheckPending,
        isExtendedSupportAvailable,
        isEdit,
        isCopy,
        editUUID: uuid,
      }}
    >
      {children}
    </AddOrEditTemplateContext.Provider>
  );
};

export const useAddOrEditTemplateContext = () => useContext(AddOrEditTemplateContext);
