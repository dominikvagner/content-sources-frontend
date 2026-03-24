import {
  Form,
  FormGroup,
  Grid,
  Content,
  ContentVariants,
  Title,
  MenuToggle,
  Dropdown,
  DropdownItem,
  DropdownList,
  List,
  ListItem,
  FormGroupLabelHelp,
} from '@patternfly/react-core';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';
import { useState, useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import { SUPPORTED_MAJOR_VERSIONS, SUPPORTED_ARCHES, STANDARD_STREAM } from '../../../constants';
import {
  extractMajorVersion,
  isMinorVersionOfMajor,
  isArchManuallyDisabled,
} from '../../../helpers';
import useDistributionDetails from '../../../../../../Hooks/useDistributionDetails';
import Hide from '../../../../../../components/Hide/Hide';
import HelpPopover from '../../../../../../components/HelpPopover';
import text from '@patternfly/react-styles/css/utilities/Text/text';

const useStyles = createUseStyles({
  fullWidth: {
    width: '100%!important',
    maxWidth: 'unset!important',
  },
});

export const RELEASE_STREAMS_DOCS_URL = 'https://access.redhat.com/support/policy/updates/errata';

export default function OSAndArchitectureStep() {
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [isReleaseStreamOpen, setIsReleaseStreamOpen] = useState(false);

  const {
    isEdit,
    templateRequest,
    setTemplateRequest,
    distribution_versions,
    distribution_arches,
    extended_release_streams,
    distribution_minor_versions,
    isExtendedSupportAvailable,
  } = useAddOrEditTemplateContext();

  const { getVersionName, getStreamName, getMinorVersionName, getArchName } =
    useDistributionDetails();

  const isStandardStream =
    !isExtendedSupportAvailable || templateRequest.extended_release === STANDARD_STREAM.label;

  const handleVersionChange = (newVersion: string) => {
    setTemplateRequest((prev) => {
      const newMajorVersion = isStandardStream ? newVersion : extractMajorVersion(newVersion);

      // Clear arch if it becomes disabled for the new version
      const shouldClearArch =
        prev.arch &&
        isArchManuallyDisabled(prev.arch, prev.extended_release || '', newMajorVersion);

      return {
        ...prev,
        version: newMajorVersion,
        ...(isStandardStream ? {} : { extended_release_version: newVersion }),
        ...(shouldClearArch ? { arch: '' } : {}),
      };
    });
  };

  const handleStreamChange = (newStream: string) => {
    setTemplateRequest((prev) => ({
      ...prev,
      extended_release: newStream,
      // Each stream has different available versions and architectures
      version: '',
      extended_release_version: '',
      arch: '',
    }));
  };

  const isArchDisabledForStream = useCallback(
    (arch: string) => {
      if (
        isArchManuallyDisabled(
          arch,
          templateRequest.extended_release || '',
          templateRequest.version || '',
        )
      ) {
        return true;
      }

      // Standard stream allows all architectures
      if (
        !isExtendedSupportAvailable ||
        templateRequest.extended_release === STANDARD_STREAM.label
      ) {
        return false;
      }

      // Find the selected extended release stream
      const selectedStream = extended_release_streams.find(
        (stream) => stream.label === templateRequest.extended_release,
      );

      // If no stream found or no architectures defined, disable nothing
      if (!selectedStream || !selectedStream.architectures) {
        return false;
      }

      // Disable if the architecture is not entitled for this stream
      const streamArch = selectedStream.architectures.find((a) => a.label === arch);
      return !streamArch || !streamArch.entitled;
    },
    [
      isExtendedSupportAvailable,
      templateRequest.extended_release,
      templateRequest.version,
      extended_release_streams,
    ],
  );

  const isVersionDisabledForStream = useCallback(
    (minorVersion: string) => {
      const majorVersion = extractMajorVersion(minorVersion);
      // For EEUS version 9, x86_64 is manually disabled
      // If aarch64 is also not entitled, disable all 9.X versions
      if (templateRequest.extended_release === 'eeus' && majorVersion === '9') {
        const selectedStream = extended_release_streams.find((stream) => stream.label === 'eeus');

        if (selectedStream?.architectures) {
          const aarch64 = selectedStream.architectures.find((a) => a.label === 'aarch64');
          return !aarch64 || !aarch64.entitled;
        }
      }
      return false;
    },
    [templateRequest.extended_release, extended_release_streams],
  );

  const classes = useStyles();

  return (
    <Grid hasGutter>
      <Title ouiaId='define_template_content' headingLevel='h1'>
        OS and architecture
      </Title>
      <Content component={ContentVariants.p}>
        Templates provide consistent content across environments and time. They enable you to
        control the scope of package and advisory updates that will be installed on selected
        systems. Based on your filters, the base repositories will be added to this template.
      </Content>

      <Form>
        <Hide hide={!isExtendedSupportAvailable}>
          <FormGroup
            label='Release stream'
            isRequired
            labelHelp={
              <HelpPopover
                aria-label='Release stream types'
                headerContent={<div>Release stream types</div>}
                bodyContent={
                  <>
                    <p>Select the release stream option for your system updates:</p>
                    <List>
                      <ListItem>
                        <span className={text.fontWeightBold}>Standard:</span> Provides the latest
                        features, bug fixes, and security patches through the full support lifecycle
                        of the major release.
                      </ListItem>
                      <ListItem>
                        <span className={text.fontWeightBold}>Extended Update Support (EUS):</span>{' '}
                        Locks your system to a specific minor release for up to an additional 24
                        months of critical security and urgent bug fixes.
                      </ListItem>
                      <ListItem>
                        <span className={text.fontWeightBold}>Update Services for SAP (E4S):</span>{' '}
                        Offers specialized fixes specifically for SAP solution environments on
                        select minor releases.
                      </ListItem>
                      <ListItem>
                        <span className={text.fontWeightBold}>
                          Enhanced Extended Update Support (EEUS):
                        </span>{' '}
                        Locks your system to a specific minor release for up to an additional 48
                        months of critical security and urgent bug fixes.
                      </ListItem>
                    </List>
                  </>
                }
                linkText='Learn more about release streams'
                linkUrl={RELEASE_STREAMS_DOCS_URL}
              >
                <FormGroupLabelHelp aria-label='Help' />
              </HelpPopover>
            }
          >
            <Dropdown
              onSelect={(_, value: string) => {
                handleStreamChange(value);
                setIsReleaseStreamOpen(false);
              }}
              isOpen={isReleaseStreamOpen}
              onOpenChange={(isOpen) => setIsReleaseStreamOpen(isOpen)}
              toggle={(toggleRef) => (
                <ConditionalTooltip
                  position='top-start'
                  content='Release stream cannot be changed after creation.'
                  show={!!isEdit}
                  setDisabled
                >
                  <MenuToggle
                    ref={toggleRef}
                    isFullWidth
                    aria-label='Release stream toggle'
                    id='release-stream-toggle'
                    ouiaId='select-release-stream'
                    isExpanded={isReleaseStreamOpen}
                    onClick={() => setIsReleaseStreamOpen((prev) => !prev)}
                    className={classes.fullWidth}
                  >
                    {getStreamName(templateRequest.extended_release) || STANDARD_STREAM.name}
                  </MenuToggle>
                </ConditionalTooltip>
              )}
            >
              <DropdownList>
                {[STANDARD_STREAM, ...extended_release_streams].map(({ label, name }) => (
                  <DropdownItem
                    isSelected={label === templateRequest.extended_release}
                    data-ouia-component-id={`filter_${label}`}
                    key={label}
                    value={label}
                    component='button'
                  >
                    {name}
                  </DropdownItem>
                ))}
              </DropdownList>
            </Dropdown>
          </FormGroup>
        </Hide>

        <FormGroup label='Operating system version' isRequired>
          <Dropdown
            onSelect={(_, value) => {
              handleVersionChange(value as string);
              setIsVersionOpen(false);
            }}
            toggle={(toggleRef) => (
              <ConditionalTooltip
                position='top-start'
                content='OS version cannot be changed after creation.'
                show={!!isEdit && isStandardStream}
                setDisabled
              >
                <MenuToggle
                  ref={toggleRef}
                  className={classes.fullWidth}
                  isFullWidth
                  aria-label='filter OS version'
                  id='versionSelection'
                  ouiaId='restrict_to_os_version'
                  onClick={() => setIsVersionOpen((prev) => !prev)}
                  isExpanded={isVersionOpen}
                >
                  {(isStandardStream
                    ? getVersionName(templateRequest?.version)
                    : getMinorVersionName(templateRequest?.extended_release_version)) ||
                    'Select OS version'}
                </MenuToggle>
              </ConditionalTooltip>
            )}
            onOpenChange={(isOpen) => setIsVersionOpen(isOpen)}
            isOpen={isVersionOpen}
          >
            <DropdownList>
              {isStandardStream
                ? distribution_versions
                    .filter(({ label }) => SUPPORTED_MAJOR_VERSIONS.includes(label))
                    .map(({ label: major, name }) => (
                      <DropdownItem
                        key={major}
                        value={major}
                        isSelected={major === templateRequest?.version}
                        component='button'
                        data-ouia-component-id={`filter_${major}`}
                      >
                        {name}
                      </DropdownItem>
                    ))
                : distribution_minor_versions
                    .filter(({ extended_release_streams }) =>
                      extended_release_streams?.includes(templateRequest?.extended_release || ''),
                    )
                    .filter(({ label: minor }) => !isVersionDisabledForStream(minor))
                    .map(({ label: minor }) => (
                      <DropdownItem
                        key={minor}
                        value={minor}
                        // Disable minor versions outside the selected major version when editing
                        isDisabled={
                          !!isEdit && !isMinorVersionOfMajor(minor, templateRequest?.version)
                        }
                        isSelected={minor === templateRequest?.extended_release_version}
                        component='button'
                        data-ouia-component-id={`filter_${minor}`}
                      >
                        {getMinorVersionName(minor)}
                      </DropdownItem>
                    ))}
            </DropdownList>
          </Dropdown>
        </FormGroup>

        <FormGroup label='Architecture' isRequired>
          <Dropdown
            onSelect={(_, value) => {
              setTemplateRequest((prev) => ({ ...prev, arch: value as string }));
              setIsArchOpen(false);
            }}
            toggle={(toggleRef) => (
              <ConditionalTooltip
                position='top-start'
                content='Architecture cannot be changed after creation.'
                show={!!isEdit}
                setDisabled
              >
                <MenuToggle
                  ref={toggleRef}
                  className={classes.fullWidth}
                  isFullWidth
                  aria-label='filter architecture'
                  id='archSelection'
                  ouiaId='restrict_to_architecture'
                  onClick={() => setIsArchOpen((prev) => !prev)}
                  isExpanded={isArchOpen}
                  isDisabled={!templateRequest?.version}
                >
                  {getArchName(templateRequest?.arch) || 'Select architecture'}
                </MenuToggle>
              </ConditionalTooltip>
            )}
            onOpenChange={(isOpen) => setIsArchOpen(isOpen)}
            isOpen={isArchOpen}
          >
            <DropdownList>
              {distribution_arches
                .filter(({ label }) => SUPPORTED_ARCHES.includes(label))
                .map(({ label, name }) => (
                  <DropdownItem
                    key={label}
                    value={label}
                    isSelected={label === templateRequest?.arch}
                    isDisabled={isArchDisabledForStream(label)}
                    component='button'
                    data-ouia-component-id={`filter_${label}`}
                  >
                    {name}
                  </DropdownItem>
                ))}
            </DropdownList>
          </Dropdown>
        </FormGroup>
      </Form>
    </Grid>
  );
}
