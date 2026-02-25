import { Button, Content, ContentVariants, Flex, FlexItem, Icon } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { reduceStringToCharsWithEllipsis } from '../../../../../../helpers';
import { PATCH_SYSTEMS_ROUTE } from '../../../../../../Routes/constants';
import type { SystemItem } from '../../../../../../services/Systems/SystemsApi';
import HelpPopover from '../../../../../../components/HelpPopover';
import React from 'react';
import { isMinorRelease } from 'Pages/Templates/TemplatesTable/components/templateHelpers';

type Props = Pick<SystemItem, 'id'> &
  Pick<SystemItem['attributes'], 'display_name' | 'rhsm' | 'satellite_managed'> & {
    basePath: string;
    isExtendedSupportTemplate: boolean;
  };

type WarningItem = {
  key: string;
  title: string;
  description: string;
};

const ABOUT_TEMPLATES_DOCS_URL =
  'https://docs.redhat.com/en/documentation/red_hat_insights/1-latest/html-single/managing_system_content_and_patch_updates_on_rhel_systems/index#about-content-templates_patching-using-content-templates';

/**
 * Renders a system name with a warning icon if the system is incompatible with the template.
 * Incompatibility reasons: satellite-managed, or release type mismatch (standard templates
 * require major release systems while extended support templates require minor release systems).
 */
export default function SystemNameCell({
  id,
  display_name,
  rhsm,
  basePath,
  satellite_managed,
  isExtendedSupportTemplate,
}: Props) {
  const name = (
    <Button isInline variant='link' component='a' href={`${basePath}${PATCH_SYSTEMS_ROUTE}${id}`}>
      {reduceStringToCharsWithEllipsis(display_name)}
    </Button>
  );

  const warnings: WarningItem[] = [];

  if (!isExtendedSupportTemplate && isMinorRelease(rhsm)) {
    warnings.push({
      key: 'minor-release-warning',
      title: `This system is on a minor release version: ${rhsm}`,
      description: 'Unset the minor release version to associate a standard template.',
    });
  }

  if (satellite_managed) {
    warnings.push({
      key: 'satellite-managed-warning',
      title: 'This system is managed by Satellite',
      description: 'Systems managed by Satellite cannot be associated with a template.',
    });
  }

  if (warnings.length === 0) {
    return name;
  }

  return (
    <Flex columnGap={{ default: 'columnGapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{name}</FlexItem>
      <FlexItem>
        {warnings.map((warning) => (
          <HelpPopover
            key={warning.key}
            headerContent={warning.title}
            headerIcon={<ExclamationTriangleIcon />}
            alertSeverityVariant='warning'
            position='right'
            triggerAction='hover'
            hasAutoWidth
            linkText='Learn more about template compatibility'
            linkUrl={ABOUT_TEMPLATES_DOCS_URL}
            bodyContent={<Content component={ContentVariants.small}>{warning.description}</Content>}
          >
            <Icon data-ouia-component-id='system-list-warning-icon' status='warning'>
              <ExclamationTriangleIcon />
            </Icon>
          </HelpPopover>
        ))}
      </FlexItem>
    </Flex>
  );
}
