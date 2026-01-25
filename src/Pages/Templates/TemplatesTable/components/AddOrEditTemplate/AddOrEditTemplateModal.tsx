import {
  Bullseye,
  Modal,
  ModalVariant,
  Spinner,
  Wizard,
  WizardFooterWrapper,
  WizardHeader,
  WizardStep,
  useWizardContext,
} from '@patternfly/react-core';

import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCreateTemplateQuery, useEditTemplateQuery } from 'services/Templates/TemplateQueries';
import {
  AddOrEditTemplateContextProvider,
  useAddOrEditTemplateContext,
} from './AddOrEditTemplateContext';
import RedhatRepositoriesStep from './steps/RedhatRepositoriesStep';
import CustomRepositoriesStep from './steps/CustomRepositoriesStep';
import { TemplateRequest } from 'services/Templates/TemplateApi';

import SetUpDateStep from './steps/SetUpDateStep';
import DetailStep from './steps/DetailStep';
import ReviewStep from './steps/ReviewStep';
import { formatTemplateDate } from 'helpers';
import { isEmpty } from 'lodash';
import { createUseStyles } from 'react-jss';
import { useEffect, useRef } from 'react';
import { AddTemplateButton } from './AddTemplateButton';
import useRootPath from 'Hooks/useRootPath';
import { TEMPLATES_ROUTE } from 'Routes/constants';
import DefineContentStep from './steps/DefineContentStep';
import ExtendedSupportStep from './steps/ExtendedSupportStep';
import { hasExtendedSupport, SUPPORTED_EUS_ARCHES } from '../templateHelpers';

const useStyles = createUseStyles({
  minHeightForSpinner: {
    minHeight: '60vh',
  },
});

const DEFAULT_STEP_ID = 'define-content';
const DEFAULT_STEP_INDEX = 2;

const stepIdToIndex: Record<string, number> = {
  [DEFAULT_STEP_ID]: DEFAULT_STEP_INDEX,
  'content-versioning': 3,
  'redhat-repositories': 4,
  'custom-repositories': 5,
  'set-up-date': 6,
  detail: 7,
  review: 8,
};

// Component to sync URL with wizard state (must be inside Wizard)
const WizardUrlSync = ({
  onCancel,
  isArchSupportedByEUS,
}: {
  onCancel: () => void;
  isArchSupportedByEUS: boolean;
}) => {
  const { goToStepById, activeStep } = useWizardContext();
  const [urlSearchParams] = useSearchParams();

  const tabParam = urlSearchParams.get('tab');

  useEffect(() => {
    if (tabParam && tabParam !== activeStep?.id) {
      if (stepIdToIndex[tabParam]) {
        goToStepById(tabParam);
      } else if (tabParam === 'define-content') {
        // ARM architecture doesn't support extended support releases, so skip the content versioning step
        if (!isArchSupportedByEUS) {
          goToStepById('redhat-repositories');
          return;
        }
        goToStepById(DEFAULT_STEP_ID);
      } else {
        onCancel();
      }
    }
  }, [tabParam, activeStep?.id, goToStepById, onCancel, isArchSupportedByEUS]);

  return null;
};

const AddOrEditTemplateBase = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const rootPath = useRootPath();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  // Store the original 'from' value on mount (before step navigation changes location.state)
  const fromRef = useRef(location.state?.from);

  const {
    isEdit,
    templateRequest,
    hasInvalidSteps,
    editUUID,
    extended_release_features,
    distribution_minor_versions,
  } = useAddOrEditTemplateContext();

  const isArchSupportedByEUS = !!(
    templateRequest?.arch && SUPPORTED_EUS_ARCHES.includes(templateRequest.arch)
  );

  const isVersionSupportedByEUS =
    templateRequest?.version &&
    distribution_minor_versions?.some((dist) => dist.major === templateRequest.version);

  // useSafeUUIDParam in AddOrEditTemplateContext already validates the UUID
  // If in edit mode and UUID is invalid, it will be an empty string
  if (isEdit && !editUUID) throw new Error('UUID is invalid');

  const tabParam = urlSearchParams.get('tab');
  const initialIndex =
    tabParam && stepIdToIndex[tabParam] ? stepIdToIndex[tabParam] : DEFAULT_STEP_INDEX;

  useEffect(() => {
    if (!urlSearchParams.get('tab')) {
      setUrlSearchParams({ tab: DEFAULT_STEP_ID }, { replace: true });
    }
  }, []);

  const { queryClient } = useAddOrEditTemplateContext();

  const onCancel = () => {
    if (fromRef.current === 'table') {
      navigate(`${rootPath}/${TEMPLATES_ROUTE}`);
    } else if (isEdit && editUUID) {
      navigate(`${rootPath}/${TEMPLATES_ROUTE}/${editUUID}`);
    } else {
      navigate(`${rootPath}/${TEMPLATES_ROUTE}`);
    }
  };

  const { mutateAsync: addTemplate, isLoading: isAdding } = useCreateTemplateQuery(queryClient, {
    ...(templateRequest as TemplateRequest),
    date: templateRequest.use_latest ? null : formatTemplateDate(templateRequest.date || ''),
  });

  const { mutateAsync: editTemplate, isLoading: isEditing } = useEditTemplateQuery(queryClient, {
    uuid: editUUID as string,
    ...(templateRequest as TemplateRequest),
    date: templateRequest.use_latest ? null : formatTemplateDate(templateRequest.date || ''),
  });

  const sharedFooterProps = {
    nextButtonProps: { ouiaId: 'wizard-next-btn' },
    backButtonProps: { ouiaId: 'wizard-back-btn' },
    cancelButtonProps: { ouiaId: 'wizard-cancel-btn' },
  };

  return (
    <Modal
      ouiaId={`${isEdit ? 'edit' : 'add'}_template_modal`}
      aria-label={`${isEdit ? 'edit' : 'add'} template modal`}
      aria-describedby='edit-add-template-modal-wizard-description'
      variant={ModalVariant.large}
      isOpen
      onClose={isEdit && isEmpty(templateRequest) ? onCancel : undefined}
      disableFocusTrap
    >
      {isEdit && isEmpty(templateRequest) ? (
        <Bullseye className={classes.minHeightForSpinner}>
          <Spinner size='xl' />
        </Bullseye>
      ) : (
        <Wizard
          header={
            <>
              <WizardUrlSync onCancel={onCancel} isArchSupportedByEUS={isArchSupportedByEUS} />
              <WizardHeader
                title={`${isEdit ? 'Edit' : 'Create'} content template`}
                titleId={`${isEdit ? 'edit' : 'create'}_content_template`}
                data-ouia-component-id={`${isEdit ? 'edit' : 'create'}_content_template`}
                description='Prepare for your next patching cycle with a content template.'
                descriptionId='edit-add-template-modal-wizard-description'
                onClose={onCancel}
                closeButtonAriaLabel={`close_${isEdit ? 'edit' : 'create'}_content_template`}
              />
            </>
          }
          onClose={onCancel}
          startIndex={initialIndex}
          onStepChange={(_, currentStep) => {
            setUrlSearchParams({ tab: String(currentStep.id) });
          }}
        >
          <WizardStep
            name='Content'
            id='content'
            isExpandable
            steps={[
              <WizardStep
                name='Define content'
                id='define-content'
                key='define-content-key'
                footer={{ ...sharedFooterProps, isNextDisabled: hasInvalidSteps(1) }}
              >
                <DefineContentStep />
              </WizardStep>,
              <WizardStep
                key='content-versioning-key'
                isDisabled={hasInvalidSteps(1) || !isVersionSupportedByEUS || !isArchSupportedByEUS}
                isHidden={!hasExtendedSupport(extended_release_features)}
                name='Content versioning'
                id='content-versioning'
                footer={{ ...sharedFooterProps, isNextDisabled: hasInvalidSteps(2) }}
              >
                <ExtendedSupportStep />
              </WizardStep>,
              <WizardStep
                isDisabled={hasInvalidSteps(2)}
                name='Red Hat repositories'
                id='redhat-repositories'
                key='redhat-repositories-key'
                footer={{ ...sharedFooterProps, isNextDisabled: hasInvalidSteps(3) }}
              >
                <RedhatRepositoriesStep />
              </WizardStep>,
              <WizardStep
                isDisabled={hasInvalidSteps(3)}
                name='Other repositories'
                id='custom-repositories'
                key='custom-repositories-key'
                footer={{ ...sharedFooterProps, isNextDisabled: hasInvalidSteps(4) }}
              >
                <CustomRepositoriesStep />
              </WizardStep>,
            ]}
          />
          <WizardStep
            name='Set up date'
            id='set-up-date'
            isDisabled={hasInvalidSteps(4)}
            footer={{ ...sharedFooterProps, isNextDisabled: hasInvalidSteps(5) }}
          >
            <SetUpDateStep />
          </WizardStep>
          {/* <WizardStep name='Systems (optional)' id='systems' /> */}
          <WizardStep
            isDisabled={hasInvalidSteps(5)}
            footer={{ ...sharedFooterProps, isNextDisabled: hasInvalidSteps(6) }}
            name='Detail'
            id='detail'
          >
            <DetailStep />
          </WizardStep>
          <WizardStep
            isDisabled={hasInvalidSteps(6)}
            name='Review'
            id='review'
            footer={
              isEdit ? (
                {
                  ...sharedFooterProps,
                  nextButtonProps: { ouiaId: 'wizard-edit-btn' },
                  nextButtonText: 'Confirm changes',
                  onNext: () => editTemplate().then(() => onCancel()),
                  isNextDisabled: isEditing,
                }
              ) : (
                <WizardFooterWrapper>
                  <AddTemplateButton isAdding={isAdding} onClose={onCancel} add={addTemplate} />
                </WizardFooterWrapper>
              )
            }
          >
            <ReviewStep />
          </WizardStep>
        </Wizard>
      )}
    </Modal>
  );
};

// Wrap the modal with the provider
export function AddOrEditTemplateModal() {
  return (
    <AddOrEditTemplateContextProvider>
      <AddOrEditTemplateBase />
    </AddOrEditTemplateContextProvider>
  );
}
