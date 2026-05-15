import { LongArrowAltDownIcon, LongArrowAltUpIcon } from '@patternfly/react-icons';
import { Flex, FlexItem } from '@patternfly/react-core';
import {
  t_global_color_status_danger_default,
  t_global_color_status_success_default,
} from '@patternfly/react-tokens';
import text from '@patternfly/react-styles/css/utilities/Text/text';

interface Props {
  addedCount: number;
  removedCount: number;
}

const ChangedArrows = ({ addedCount, removedCount }: Props) => (
  <Flex gap={{ default: 'gapSm' }} className={text.fontWeightBold}>
    <Flex
      gap={{ default: 'gapXs' }}
      alignItems={{ default: 'alignItemsCenter' }}
      style={{ color: t_global_color_status_success_default.var }}
    >
      <FlexItem>
        <LongArrowAltUpIcon />
      </FlexItem>
      <FlexItem>{addedCount}</FlexItem>
    </Flex>
    <Flex
      gap={{ default: 'gapXs' }}
      alignItems={{ default: 'alignItemsCenter' }}
      style={{ color: t_global_color_status_danger_default.var }}
    >
      <FlexItem>
        <LongArrowAltDownIcon />
      </FlexItem>
      <FlexItem>{removedCount}</FlexItem>
    </Flex>
  </Flex>
);

export default ChangedArrows;
