import {
  SeverityCriticalIcon,
  SeverityImportantIcon,
  SeverityModerateIcon,
  SeverityMinorIcon,
  SeverityNoneIcon,
} from '@patternfly/react-icons';
import {
  t_global_color_severity_critical_100,
  t_global_color_severity_important_100,
  t_global_color_severity_moderate_100,
  t_global_color_severity_minor_100,
  t_global_color_severity_none_100,
  t_global_spacer_sm,
} from '@patternfly/react-tokens';
import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = (severity: string) => {
  let color: string = t_global_color_severity_none_100.value;
  switch (severity) {
    case 'minor':
    case 'low':
      color = t_global_color_severity_minor_100.value;
      break;
    case 'moderate':
      color = t_global_color_severity_moderate_100.value;
      break;
    case 'important':
      color = t_global_color_severity_important_100.value;
      break;
    case 'critical':
      color = t_global_color_severity_critical_100.value;
      break;
  }

  return createUseStyles({
    icon: {
      fill: color,
      marginRight: t_global_spacer_sm.var,
    },
  });
};

interface Props {
  severity: string;
}

export default function SeverityIcon({ severity }: Props) {
  const loweredSeverity = severity?.toLowerCase();
  const classes = useStyles(loweredSeverity)();

  const Icon = useMemo(() => {
    switch (loweredSeverity) {
      case 'minor':
      case 'low':
        return SeverityMinorIcon;
      case 'moderate':
        return SeverityModerateIcon;
      case 'important':
        return SeverityImportantIcon;
      case 'critical':
        return SeverityCriticalIcon;
      default:
        return SeverityNoneIcon;
    }
  }, [loweredSeverity]);

  return (
    <>
      <Icon className={classes.icon} />
      {severity}
    </>
  );
}
