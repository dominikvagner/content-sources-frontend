import {
  ExpandableSection,
  Flex,
  Grid,
  Content,
  ContentVariants,
  Title,
} from '@patternfly/react-core';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import { useMemo, useState } from 'react';
import { formatDateDDMMMYYYY } from 'helpers';
import useDistributionDetails from '../../../../../../Hooks/useDistributionDetails';
import { STANDARD_STREAM } from '../../../constants';

export default function ReviewStep() {
  const [expanded, setExpanded] = useState(new Set([0]));

  const { templateRequest, selectedRedHatRepos, redHatCoreRepos, selectedCustomRepos, isEdit } =
    useAddOrEditTemplateContext();

  const {
    getVersionName,
    getStreamName,
    getMinorVersionName,
    isExtendedSupportAvailable,
    getArchName,
  } = useDistributionDetails();

  const review = useMemo(() => {
    const {
      arch,
      version: major,
      extended_release_version: minor,
      extended_release: stream,
      date,
      name,
      description,
    } = templateRequest;

    return {
      Content: {
        ...(isExtendedSupportAvailable
          ? {
              'Release stream':
                getStreamName(templateRequest.extended_release) || STANDARD_STREAM.name,
            }
          : {}),
        'Operating system version':
          stream && minor ? getMinorVersionName(minor) : getVersionName(major) || 'Select version',
        Architecture: getArchName(arch) || 'Select architecture',
        'Core Red Hat repositories': redHatCoreRepos.size,
        'Additional Red Hat repositories': selectedRedHatRepos.size - redHatCoreRepos.size,
        'Custom repositories': selectedCustomRepos.size,
      },
      Date: {
        ...(templateRequest.use_latest
          ? { 'Snapshot date': 'Use the latest content' }
          : { Date: formatDateDDMMMYYYY(date || '') }),
      },
      Details: {
        Name: name,
        Description: description,
      },
    } as Record<string, { [key: string]: string | number | undefined }>;
  }, [templateRequest]);

  const setToggle = (index: number) => {
    if (expanded.has(index)) {
      expanded.delete(index);
    } else {
      expanded.add(index);
    }
    setExpanded(new Set(expanded));
  };

  return (
    <Grid hasGutter>
      <Title ouiaId='review' headingLevel='h1'>
        Review
      </Title>
      <Content component={ContentVariants.p}>
        Review the information and then click <b>{isEdit ? 'Confirm changes' : 'Create'}</b>.
      </Content>
      {Object.keys(review).map((key, index) => (
        <ExpandableSection
          key={key}
          isIndented
          toggleText={key}
          onToggle={() => setToggle(index)}
          isExpanded={expanded.has(index)}
          // displaySize='lg'
          aria-label={`${key}-expansion`}
          data-ouia-component-id={`${key}_expansion`}
        >
          <Flex direction={{ default: 'row' }}>
            <Flex direction={{ default: 'column' }}>
              {Object.keys(review[key]).map((title) => (
                <Content component='p' key={title + '' + index}>
                  {title}
                </Content>
              ))}
            </Flex>
            <Flex direction={{ default: 'column' }}>
              {Object.values(review[key]).map((value, index) => (
                <Content component='p' key={value + '' + index}>
                  {value}
                </Content>
              ))}
            </Flex>
          </Flex>
        </ExpandableSection>
      ))}
    </Grid>
  );
}
