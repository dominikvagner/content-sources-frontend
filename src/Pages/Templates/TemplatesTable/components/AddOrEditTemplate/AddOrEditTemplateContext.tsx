import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TemplateRequest } from 'services/Templates/TemplateApi';
import { QueryClient, useQueryClient } from 'react-query';
import { useContentListQuery, useRepositoryParams } from 'services/Content/ContentQueries';
import { ContentOrigin, NameLabel, DistributionMinorVersion } from 'services/Content/ContentApi';
import { hardcodeRedHatReposByArchAndVersion, hasExtendedSupport } from '../templateHelpers';
import { useNavigate } from 'react-router-dom';
import { useFetchTemplate } from 'services/Templates/TemplateQueries';
import useRootPath from 'Hooks/useRootPath';
import { isDateValid } from 'helpers';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';

export interface AddOrEditTemplateContextInterface {
  queryClient: QueryClient;
  distribution_arches: NameLabel[];
  distribution_versions: NameLabel[];
  extended_release_features: NameLabel[];
  distribution_minor_versions: DistributionMinorVersion[];
  useExtendedSupport: boolean;
  setUseExtendedSupport: (value: React.SetStateAction<boolean>) => void;
  templateRequest: Partial<TemplateRequest>;
  setTemplateRequest: (value: React.SetStateAction<Partial<TemplateRequest>>) => void;
  selectedRedhatRepos: Set<string>;
  setSelectedRedhatRepos: (uuidSet: Set<string>) => void;
  selectedCustomRepos: Set<string>;
  setSelectedCustomRepos: (uuidSet: Set<string>) => void;
  hardcodedRedhatRepositoryUUIDS: Set<string>;
  hasInvalidSteps: (index: number) => boolean;
  isEdit?: boolean;
  editUUID?: string;
}

export const AddOrEditTemplateContext = createContext({} as AddOrEditTemplateContextInterface);

export const AddOrEditTemplateContextProvider = ({ children }: { children: ReactNode }) => {
  const uuid = useSafeUUIDParam('templateUUID');
  const { data: editTemplateData, isError } = useFetchTemplate(uuid, !!uuid);

  const navigate = useNavigate();
  const rootPath = useRootPath();

  if (isError) navigate(rootPath);
  const [templateRequest, setTemplateRequest] = useState<Partial<TemplateRequest>>({
    extended_release: '',
    extended_release_version: '',
  });

  const [useExtendedSupport, setUseExtendedSupport] = useState(false);
  const [selectedRedhatRepos, setSelectedRedhatRepos] = useState<Set<string>>(new Set());
  const [selectedCustomRepos, setSelectedCustomRepos] = useState<Set<string>>(new Set());
  const [hardcodedRedhatRepositories, setHardcodeRepositories] = useState<string[]>([]);
  const [hardcodedRedhatRepositoryUUIDS, setHardcodeRepositoryUUIDS] = useState<Set<string>>(
    new Set(),
  );

  const {
    data: {
      distribution_versions = [],
      distribution_arches = [],
      extended_release_features = [],
      distribution_minor_versions = [],
    } = {},
  } = useRepositoryParams();

  const stepValidationSequence = useMemo(() => {
    const { arch, date, name, version, use_latest, extended_release, extended_release_version } =
      templateRequest;

    // Valid if: feature is unavailable, unused, or all required fields filled with valid values
    const isVersioningStepValid =
      !hasExtendedSupport(extended_release_features) ||
      !useExtendedSupport ||
      (extended_release && extended_release_version);

    return [
      true, // [0] No step
      arch && version, // [1] "Define content" step
      isVersioningStepValid, // [2] "Content versioning" step
      !!selectedRedhatRepos.size, // [3] "Red Hat repositories" step
      true, // [4] "Other repositories" step - optional step
      use_latest || isDateValid(date ?? ''), // [5] "Setup date" step
      !!name && name.length < 256, // [6] "Detail" step
    ] as boolean[];
  }, [templateRequest, selectedRedhatRepos.size, useExtendedSupport, extended_release_features]);

  const hasInvalidSteps = useCallback(
    (stepIndex: number) => {
      const stepsToCheck = stepValidationSequence.slice(0, stepIndex + 1);
      return !stepsToCheck.every((step) => step);
    },
    [selectedRedhatRepos.size, stepValidationSequence],
  );

  const queryClient = useQueryClient();

  const { data } = useContentListQuery(
    1,
    10,
    { urls: hardcodedRedhatRepositories },
    '',
    [ContentOrigin.REDHAT],
    !!hardcodedRedhatRepositories.length,
  );

  const { data: existingRepositoryInformation, isLoading } = useContentListQuery(
    1,
    10,
    { uuids: editTemplateData?.repository_uuids },
    '',
    [ContentOrigin.ALL],
    !!uuid && !!editTemplateData?.repository_uuids.length,
  );

  useEffect(() => {
    if (!!templateRequest.arch && !!templateRequest.version) {
      const result = hardcodeRedHatReposByArchAndVersion(
        templateRequest.arch,
        templateRequest.version,
      );
      if (result) {
        setHardcodeRepositories(result);
      }
      if (!uuid) setSelectedCustomRepos(new Set());
    }
  }, [templateRequest.version, templateRequest.arch, uuid]);

  useEffect(() => {
    if (data?.data?.length) {
      const hardcodedItems = data?.data.map((item) => item.uuid);

      setHardcodeRepositoryUUIDS(new Set(hardcodedItems));
      setSelectedRedhatRepos(
        new Set(
          selectedRedhatRepos.has(hardcodedItems[0])
            ? [...selectedRedhatRepos, ...hardcodedItems]
            : hardcodedItems,
        ),
      );
    }
  }, [data?.data]);

  // If editing, we want to load in the current data
  useEffect(() => {
    if (uuid && !!editTemplateData && !isLoading && !!existingRepositoryInformation) {
      const startingState = {
        ...editTemplateData,
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
        setSelectedRedhatRepos(new Set([...selectedRedhatRepos, ...redHatReposToAdd]));
      }

      if (customReposToAdd.length) {
        setSelectedCustomRepos(new Set(customReposToAdd));
      }
    }
  }, [editTemplateData, isLoading, existingRepositoryInformation]);

  const templateRequestDependencies = useMemo(
    () => [...selectedCustomRepos, ...selectedRedhatRepos],
    [selectedCustomRepos, selectedRedhatRepos],
  );

  useEffect(() => {
    setTemplateRequest((prev) => ({
      ...prev,
      repository_uuids: [...selectedRedhatRepos, ...selectedCustomRepos],
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
        selectedRedhatRepos,
        setSelectedRedhatRepos,
        selectedCustomRepos,
        setSelectedCustomRepos,
        hardcodedRedhatRepositoryUUIDS,
        hasInvalidSteps,
        isEdit: !!uuid,
        editUUID: uuid,
        useExtendedSupport,
        setUseExtendedSupport,
      }}
    >
      {children}
    </AddOrEditTemplateContext.Provider>
  );
};

export const useAddOrEditTemplateContext = () => useContext(AddOrEditTemplateContext);
