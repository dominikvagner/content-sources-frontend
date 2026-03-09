import { useQueryClient } from 'react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useRootPath from '../../../../../Hooks/useRootPath';
import React, { useState, useMemo, useEffect } from 'react';
import useNotification from '../../../../../Hooks/useNotification';
import { useFetchTemplate } from '../../../../../services/Templates/TemplateQueries';
import { useAddTemplateToSystemsQuery } from '../../../../../services/Systems/SystemsQueries';
import {
  AlertVariant,
  Modal,
  ModalVariant,
  ModalHeader,
  Button,
  FlexItem,
  Flex,
  ModalFooter,
  ModalBody,
} from '@patternfly/react-core';
import { TEMPLATES_ROUTE, SYSTEMS_ROUTE } from '../../../../../Routes/constants';
import ConditionalTooltip from '../../../../../components/ConditionalTooltip/ConditionalTooltip';
import HelpPopover from '../../../../../components/HelpPopover';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import AssignmentMethodSelect, {
  AssignmentMethods,
  AssignmentMethodOption,
} from './components/AssignmentMethodSelect';
import ManualConfigView from './ManualConfigView';
import SystemListView from './SystemListView';
import ApiView from './ApiView';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import useCompatibleSystems from '../../../../../Hooks/useCompatibleSystems';
import Loader from '../../../../../components/Loader';
import { TEMPLATE_SYSTEMS_UPDATE_LIMIT } from 'Pages/Templates/TemplatesTable/constants';

export const MANAGING_TEMPLATES_DOCS_URL =
  'https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html/managing_system_content_and_patch_updates_on_rhel_systems/patching-using-content-templates_patch-service-overview#managing-content-templates_patching-using-content-templates';

const AssignTemplateModal = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const rootPath = useRootPath();
  const navigate = useNavigate();
  const { templateUUID: uuid = '' } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const methodParam = searchParams.get('method') as AssignmentMethodOption | null;

  const initialMethod =
    methodParam && Object.values(AssignmentMethods).includes(methodParam)
      ? methodParam
      : AssignmentMethods.SystemList;

  const [assignmentMethod, setAssignmentMethod] = useState<AssignmentMethodOption>(initialMethod);

  // Update both local state and URL when assignment method changes
  const handleSetAssignmentMethod = (selection: AssignmentMethodOption) => {
    setAssignmentMethod(selection);
    if (selection === AssignmentMethods.SystemList) {
      setSearchParams({}); // Clear the method parameter
    } else {
      setSearchParams({ method: selection });
    }
  };

  const [canAssignTemplate, setCanAssignTemplate] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [polling, setPolling] = useState(false);

  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const { mutateAsync: addSystems, isLoading: isAdding } = useAddTemplateToSystemsQuery(
    queryClient,
    uuid,
    selectedSystems,
  );

  // Fetch data for the template the user is currently viewing
  const {
    data: template,
    isError,
    isFetching: isFetchingTemplate,
  } = useFetchTemplate(uuid as string, true, polling);

  const { name, last_update_task, rhsm_environment_created } = template ?? {};

  const templatePending = useMemo(
    () => last_update_task?.status === 'running' || last_update_task?.status === 'pending',
    [last_update_task],
  );

  useEffect(() => {
    if (isError) {
      setPolling(false);
      setPollCount(0);
      return;
    }

    if (polling && templatePending) {
      setPollCount(pollCount + 1);
    }
    if (polling && !templatePending) {
      setPollCount(0);
    }
    if (pollCount > 40) {
      return setPolling(false);
    }
    return setPolling(templatePending);
  }, [templatePending, isError]);

  useEffect(() => {
    if (
      !rhsm_environment_created &&
      (last_update_task?.status === 'failed' || last_update_task?.status === 'completed')
    ) {
      notify({
        title: 'Environment not created for template',
        description:
          'An error occurred when creating the environment. Cannot assign this template to a system.',
        variant: AlertVariant.danger,
        dismissable: true,
      });
    }
  }, [last_update_task]);

  const onClose = () => navigate(`${rootPath}/${TEMPLATES_ROUTE}/${uuid}/${SYSTEMS_ROUTE}`);

  const isSystemListMethod = assignmentMethod === AssignmentMethods.SystemList;

  const handlePrimaryAction = async () =>
    isSystemListMethod ? addSystems().then(onClose) : onClose();

  const isPrimaryButtonDisabled =
    isSystemListMethod &&
    (isAdding ||
      !canAssignTemplate ||
      (!rhsm_environment_created && last_update_task?.status !== 'completed'));

  const { hasCompatibleSystems, isFetchingCompatibility, isCompatibilityError } =
    useCompatibleSystems(uuid);

  useEffect(() => {
    if (isCompatibilityError) {
      onClose();
    }
  }, [isCompatibilityError, onClose]);

  // Redirect to registration view if user has no compatible systems yet still ended up at SystemList view (by manually specifying the method param)
  useEffect(() => {
    if (
      !isFetchingCompatibility &&
      !hasCompatibleSystems &&
      assignmentMethod === AssignmentMethods.SystemList
    ) {
      setAssignmentMethod(AssignmentMethods.ApiRegistration);
      setSearchParams({ method: AssignmentMethods.ApiRegistration });
    }
  }, [hasCompatibleSystems, isFetchingCompatibility, assignmentMethod, setSearchParams]);

  const fetchingOrLoading = isFetchingCompatibility || isAdding || isFetchingTemplate;

  return (
    <Modal
      key={uuid}
      position='top'
      aria-labelledby='system-modal-title'
      ouiaId='system_modal'
      ouiaSafe={!fetchingOrLoading}
      variant={ModalVariant.medium}
      isOpen
      onClose={onClose}
    >
      <ModalHeader
        title='Assign template to systems'
        labelId='system-modal-title'
        className={spacing.mbMd}
        description={
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
            <FlexItem>
              <p>
                Applying template <span className={text.fontWeightBold}>{name}</span> will overwrite
                any existing system&apos;s template. The template&apos;s content definition filters
                systems.
              </p>
            </FlexItem>
            <FlexItem>
              <AssignmentMethodSelect
                selected={assignmentMethod}
                setSelected={handleSetAssignmentMethod}
                hasCompatibleSystems={hasCompatibleSystems}
              />
            </FlexItem>
          </Flex>
        }
        help={
          <HelpPopover
            headerContent='Assign template to systems'
            bodyContent={
              <>
                <p>
                  Assign the template by selecting registered systems from the list, or use the API
                  or cURL methods as an alternative.
                </p>
                <p>This overrides any previously assigned templates on the targeted systems.</p>
              </>
            }
            linkUrl={MANAGING_TEMPLATES_DOCS_URL}
            linkText='Learn more about content templates'
          />
        }
      />

      <ModalBody>
        {template ? (
          (() => {
            switch (assignmentMethod) {
              case AssignmentMethods.SystemList:
                return (
                  <SystemListView
                    selectedSystems={selectedSystems}
                    setSelectedSystems={setSelectedSystems}
                    template={{
                      arch: template.arch!,
                      version: template.version!,
                      extended_release: template?.extended_release,
                      extended_release_version: template?.extended_release_version,
                    }}
                    setCanAssignTemplate={setCanAssignTemplate}
                    handleModalClose={onClose}
                  />
                );

              case AssignmentMethods.ApiAssignment:
              case AssignmentMethods.ApiRegistration:
                return (
                  <ApiView
                    variant={
                      assignmentMethod === AssignmentMethods.ApiAssignment
                        ? 'registered'
                        : 'unregistered'
                    }
                    template={{ uuid, name: template.name! }}
                  />
                );

              case AssignmentMethods.ManualConfig:
                return <ManualConfigView template={{ uuid }} />;

              default:
                // Compile-time safe as TS will err if a new option is added but not associated with a component
                // If somehow reached at runtime, render nothing (safe)
                return (assignmentMethod satisfies never) || null;
            }
          })()
        ) : (
          <Loader />
        )}
      </ModalBody>

      <ModalFooter>
        <Flex gap={{ default: 'gapMd' }}>
          <ConditionalTooltip
            content={
              !rhsm_environment_created
                ? 'Cannot assign this template to a system yet.'
                : selectedSystems.length > TEMPLATE_SYSTEMS_UPDATE_LIMIT
                  ? `Cannot assign a template to more than ${TEMPLATE_SYSTEMS_UPDATE_LIMIT} systems at a time.`
                  : undefined
            }
            show={
              !rhsm_environment_created || selectedSystems.length > TEMPLATE_SYSTEMS_UPDATE_LIMIT
            }
            setDisabled
          >
            <Button
              variant='primary'
              onClick={handlePrimaryAction}
              isLoading={isSystemListMethod && isAdding}
              isDisabled={isPrimaryButtonDisabled}
            >
              {isSystemListMethod ? 'Save' : 'Close'}
            </Button>
          </ConditionalTooltip>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
        </Flex>
      </ModalFooter>
    </Modal>
  );
};

export default AssignTemplateModal;
