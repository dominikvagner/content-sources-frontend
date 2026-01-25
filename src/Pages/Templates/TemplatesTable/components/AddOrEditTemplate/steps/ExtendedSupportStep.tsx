import {
  Grid,
  Title,
  Content,
  ContentVariants,
  Form,
  FormGroup,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
  Radio,
  FlexItem,
  Flex,
  Alert,
} from '@patternfly/react-core';
import { useState } from 'react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import { createUseStyles } from 'react-jss';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import Hide from '../../../../../../components/Hide/Hide';
import { useCheckStreamAvailability } from '../../../../../../Hooks/useCheckStreamAvailability';
import { EUS } from '../../templateHelpers';

const useStyles = createUseStyles({
  fullWidth: {
    width: '100%!important',
    maxWidth: 'unset!important',
  },
});

const ExtendedSupportStep = () => {
  const {
    extended_release_features,
    distribution_minor_versions,
    templateRequest,
    setTemplateRequest,
    useExtendedSupport,
    setUseExtendedSupport,
  } = useAddOrEditTemplateContext();

  const [isEusAvailable, isE4sAvailable] = useCheckStreamAvailability();

  const [isUpdateStreamOpen, setIsUpdateStreamOpen] = useState(false);
  const [isMinorVersionOpen, setIsMinorVersionOpen] = useState(false);

  const minorVersionsForCurrentMajor = distribution_minor_versions.filter(
    ({ major }) => major === templateRequest.version,
  );

  const handleLatestReleaseChange = () => {
    if (useExtendedSupport) {
      setUseExtendedSupport(false);
      setTemplateRequest((prev) => ({
        ...prev,
        extended_release: '',
        extended_release_version: '',
      }));
    }
  };

  const handleExtendedSupportChange = () => {
    if (!useExtendedSupport) {
      setUseExtendedSupport(true);
      setTemplateRequest((prev) => ({
        ...prev,
      }));
    }
  };

  const classes = useStyles();

  return (
    <Grid hasGutter>
      <Title ouiaId='content-versioning' headingLevel='h1'>
        Content versioning
      </Title>
      <Content component={ContentVariants.p}>
        Configure how your templates handle release upgrades. You can automatically float to the
        newest release or lock to a specific minor version.
      </Content>

      <Form>
        <FormGroup>
          <Flex
            direction={{ default: 'column' }}
            gap={{ default: 'gapLg' }}
            className={spacing.pbMd}
          >
            <FlexItem>
              <Radio
                id='latest-release'
                ouiaId='latest-release-radio'
                name='use-latest-release'
                label='Latest release'
                description='Systems will automatically upgrade to the next minor release as soon as it becomes available.'
                isChecked={!useExtendedSupport}
                onChange={handleLatestReleaseChange}
              />
            </FlexItem>
            <FlexItem>
              <Radio
                id='extended-support'
                ouiaId='extended-support-radio'
                name='use-extended-support'
                label='Extended support releases'
                description='Restricts content to a specific minor version. Future minor releases will be excluded to maintain stability.'
                isChecked={useExtendedSupport}
                onChange={handleExtendedSupportChange}
              />
            </FlexItem>
          </Flex>
          <Hide hide={!useExtendedSupport}>
            <Alert
              variant='warning'
              isInline
              title='To use extended support update streams, your systems must be locked to a specific minor version of RHEL for the template to apply correctly.'
            />
          </Hide>
        </FormGroup>

        <Hide hide={!useExtendedSupport}>
          <FormGroup label='Update stream' isRequired>
            <Dropdown
              onSelect={(_, value: string) => {
                setTemplateRequest((prev) => ({ ...prev, extended_release: value }));
                setIsUpdateStreamOpen(false);
              }}
              isOpen={isUpdateStreamOpen}
              onOpenChange={(isOpen) => setIsUpdateStreamOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  isFullWidth
                  aria-label='Update stream toggle'
                  id='update-stream-toggle'
                  ouiaId='select-update-stream'
                  isExpanded={isUpdateStreamOpen}
                  onClick={() => setIsUpdateStreamOpen((prev) => !prev)}
                  className={classes.fullWidth}
                >
                  {extended_release_features.find(
                    ({ label }) => label === templateRequest.extended_release,
                  )?.name || 'Select update stream'}
                </MenuToggle>
              )}
            >
              <DropdownList>
                {extended_release_features.map(({ label, name }) => (
                  <DropdownItem
                    isSelected={label === templateRequest.extended_release}
                    isDisabled={label === EUS ? !isEusAvailable : !isE4sAvailable}
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

          <FormGroup label='Minor release' isRequired>
            <Dropdown
              onSelect={(_, value: string) => {
                setTemplateRequest((prev) => ({ ...prev, extended_release_version: value }));
                setIsMinorVersionOpen(false);
              }}
              isOpen={isMinorVersionOpen}
              onOpenChange={(isOpen) => setIsMinorVersionOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  isFullWidth
                  aria-label='Minor version toggle'
                  id='minor-version-toggle'
                  ouiaId='select-minor-version'
                  isExpanded={isMinorVersionOpen}
                  isDisabled={!templateRequest.extended_release}
                  onClick={() => setIsMinorVersionOpen((prev) => !prev)}
                  className={classes.fullWidth}
                >
                  {minorVersionsForCurrentMajor.find(
                    (distribution) =>
                      distribution.label === templateRequest.extended_release_version,
                  )?.name || 'Select minor version'}
                </MenuToggle>
              )}
            >
              <DropdownList>
                {minorVersionsForCurrentMajor
                  .filter(({ feature_names }) =>
                    feature_names.includes(templateRequest.extended_release!),
                  )
                  .map(({ label, name }) => (
                    <DropdownItem
                      isSelected={label === templateRequest.extended_release_version}
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
      </Form>

      {/* What does this mean? */}
    </Grid>
  );
};

export default ExtendedSupportStep;
