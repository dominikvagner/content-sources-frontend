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
import { QueryClient, useQueryClient } from 'react-query';
import { useContentListQuery, useRepositoryParams } from 'services/Content/ContentQueries';
import { ContentOrigin, NameLabel, DistributionMinorVersion } from 'services/Content/ContentApi';
import { useNavigate } from 'react-router-dom';
import { useFetchTemplate } from 'services/Templates/TemplateQueries';
import useRootPath from 'Hooks/useRootPath';
import { isDateValid } from 'helpers';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import useDistributionDetails from '../../../../../Hooks/useDistributionDetails';
import { getRedHatCoreRepoUrls, isExtendedSupportTemplate } from '../../helpers';
import { STANDARD_STREAM } from '../../constants';

export interface AddOrEditTemplateContextInterface {
  queryClient: QueryClient;
  distribution_arches: NameLabel[];
  distribution_versions: NameLabel[];
  extended_release_features: NameLabel[];
  distribution_minor_versions: DistributionMinorVersion[];
  templateRequest: Partial<TemplateRequest>;
  setTemplateRequest: (value: React.SetStateAction<Partial<TemplateRequest>>) => void;
  selectedRedHatRepos: Set<string>;
  setSelectedRedHatRepos: (uuidSet: Set<string>) => void;
  selectedCustomRepos: Set<string>;
  setSelectedCustomRepos: (uuidSet: Set<string>) => void;
  redHatCoreRepos: Set<string>;
  hasInvalidSteps: (index: number) => boolean;
  isEdit?: boolean;
  editUUID?: string;
}

export const AddOrEditTemplateContext = createContext({} as AddOrEditTemplateContextInterface);

export const AddOrEditTemplateContextProvider = ({ children }: { children: ReactNode }) => {
  const uuid = useSafeUUIDParam('templateUUID');
  const { data: editTemplateData, isError } = useFetchTemplate(uuid, !!uuid);

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

  const hasLoadedEditData = useRef(false);
  const lastLoadedMinorVersion = useRef<string | undefined>();

  const {
    data: {
      distribution_versions = [],
      distribution_arches = [],
      extended_release_features = [],
      distribution_minor_versions = [],
    } = {},
  } = useRepositoryParams();

  const { arch, version, extended_release, extended_release_version } = templateRequest;

  const { isExtendedSupportAvailable } = useDistributionDetails();

  const usesExtendedSupportStream =
    isExtendedSupportAvailable &&
    isExtendedSupportTemplate(extended_release, extended_release_version);

  // Step validation //

  const stepValidationSequence = useMemo(() => {
    const { arch, date, name, version, use_latest, extended_release_version } = templateRequest;
    const isPlatformDefined = arch && version;

    return [
      true, // [0] No step
      usesExtendedSupportStream ? isPlatformDefined && extended_release_version : isPlatformDefined, // [1] "OS and architecture" step
      !!selectedRedHatRepos.size, // [2] "Red Hat repositories" step
      true, // [3] "Other repositories" step - optional step
      use_latest || isDateValid(date ?? ''), // [4] "Setup date" step
      !!name && name.length < 256, // [5] "Detail" step
    ] as boolean[];
  }, [templateRequest, selectedRedHatRepos.size, usesExtendedSupportStream]);

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
    { keepPreviousData: false, staleTime: 0 },
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

  const { data: existingRepositoryInformation, isLoading } = useContentListQuery(
    1,
    10,
    { uuids: editTemplateData?.repository_uuids },
    '',
    [ContentOrigin.ALL],
    !!uuid && !!editTemplateData?.repository_uuids.length,
  );

  // If editing, we want to load the data from the existing template
  useEffect(() => {
    const shouldLoadEditData =
      uuid &&
      !!editTemplateData &&
      !isLoading &&
      !!existingRepositoryInformation &&
      !hasLoadedEditData.current;

    if (shouldLoadEditData) {
      const { extended_release, extended_release_version } = editTemplateData;

      if (extended_release && extended_release_version) {
        lastLoadedMinorVersion.current = extended_release_version;
      }

      const startingState = {
        ...editTemplateData,
        extended_release: extended_release || STANDARD_STREAM.label,
      };

      setTemplateRequest(startingState);

      const redHatReposToAdd: string[] = [];
      const customReposToAdd: string[] = [];

      existingRepositoryInformation?.data.forEach((item) => {
        if (item.org_id === '-1') {
          redHatReposToAdd.push(item.uuid);
        } else {
          customReposToAdd.push(item.uuid);
        }
      });

      if (redHatReposToAdd.length) {
        setSelectedRedHatRepos(new Set([...selectedRedHatRepos, ...redHatReposToAdd]));
      }

      if (customReposToAdd.length) {
        setSelectedCustomRepos(new Set(customReposToAdd));
      }
      hasLoadedEditData.current = true;
    }
  }, [editTemplateData, isLoading, existingRepositoryInformation]);

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
        extended_release_features,
        distribution_minor_versions,
        templateRequest,
        setTemplateRequest,
        selectedRedHatRepos,
        setSelectedRedHatRepos,
        selectedCustomRepos,
        setSelectedCustomRepos,
        redHatCoreRepos,
        hasInvalidSteps,
        isEdit: !!uuid,
        editUUID: uuid,
      }}
    >
      {children}
    </AddOrEditTemplateContext.Provider>
  );
};

export const useAddOrEditTemplateContext = () => useContext(AddOrEditTemplateContext);
