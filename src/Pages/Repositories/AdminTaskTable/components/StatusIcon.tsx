import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanIcon,
  ClockIcon,
} from '@patternfly/react-icons';
import { Flex, FlexItem, Spinner } from '@patternfly/react-core';
import StatusText from 'components/StatusText/StatusText';
import {
  t_global_color_status_danger_default,
  t_global_color_status_success_default,
  t_global_color_status_warning_default,
} from '@patternfly/react-tokens';
import { createUseStyles } from 'react-jss';
import { AdminTask } from 'services/Admin/AdminTaskApi';

const red = t_global_color_status_danger_default.var;
const green = t_global_color_status_success_default.var;
const gold = t_global_color_status_warning_default.var;

const useStyles = createUseStyles({
  spinner: {
    animationDuration: '6s !important',
    margin: '-3px 0',
  },
  red: {
    color: red,
    fill: red,
  },
  green: {
    color: green,
    fill: green,
  },
  gold: {
    color: gold,
    fill: gold,
  },
});

interface Props {
  status: AdminTask['status'];
  removeText?: boolean;
}

const StatusIcon = ({ status, removeText = false }: Props) => {
  const classes = useStyles();

  switch (status) {
    case 'running':
      return (
        <Flex alignContent={{ default: 'alignContentCenter' }} direction={{ default: 'row' }}>
          <FlexItem spacer={{ default: 'spacerSm' }}>
            <Spinner size='md' className={classes.spinner} />
          </FlexItem>
          {!removeText && (
            <FlexItem>
              <StatusText>Running</StatusText>
            </FlexItem>
          )}
        </Flex>
      );
    case 'failed':
      return (
        <Flex alignContent={{ default: 'alignContentCenter' }} direction={{ default: 'row' }}>
          <FlexItem spacer={{ default: 'spacerSm' }}>
            <ExclamationCircleIcon className={classes.red} />
          </FlexItem>
          {!removeText && (
            <FlexItem>
              <StatusText>Failed</StatusText>
            </FlexItem>
          )}
        </Flex>
      );
    case 'completed':
      return (
        <Flex alignContent={{ default: 'alignContentCenter' }} direction={{ default: 'row' }}>
          <FlexItem spacer={{ default: 'spacerSm' }}>
            <CheckCircleIcon className={classes.green} />
          </FlexItem>
          {!removeText && (
            <FlexItem>
              <StatusText>Completed</StatusText>
            </FlexItem>
          )}
        </Flex>
      );
    case 'canceled':
      return (
        <Flex alignContent={{ default: 'alignContentCenter' }} direction={{ default: 'row' }}>
          <FlexItem spacer={{ default: 'spacerSm' }}>
            <BanIcon className={classes.red} />
          </FlexItem>
          {!removeText && (
            <FlexItem>
              <StatusText>Canceled</StatusText>
            </FlexItem>
          )}
        </Flex>
      );
    case 'pending':
      return (
        <Flex alignContent={{ default: 'alignContentCenter' }} direction={{ default: 'row' }}>
          <FlexItem spacer={{ default: 'spacerSm' }}>
            <ClockIcon className={classes.gold} />
          </FlexItem>
          {!removeText && (
            <FlexItem>
              <StatusText>Pending</StatusText>
            </FlexItem>
          )}
        </Flex>
      );
    default:
      return <></>;
  }
};

export default StatusIcon;
