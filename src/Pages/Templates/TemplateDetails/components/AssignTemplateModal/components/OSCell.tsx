import type { SystemItem } from '../../../../../../services/Systems/SystemsApi';
import { FlexItem, Icon, Tooltip, Flex } from '@patternfly/react-core';
import React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons';

type Props = Pick<SystemItem['attributes'], 'os' | 'rhsm'>;

const OSCell = ({ os, rhsm }: Props) => (
  <Tooltip content={`This system is locked to version ${rhsm}`}>
    <Flex flex={{ default: 'flexDefault' }} gap={{ default: 'gapSm' }}>
      <FlexItem>{os}</FlexItem>
      <FlexItem>
        <Icon data-ouia-component-id='system-list-info-icon' status='info' isInline>
          <InfoCircleIcon />
        </Icon>
      </FlexItem>
    </Flex>
  </Tooltip>
);

export default OSCell;
