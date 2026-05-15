import { createUseStyles } from 'react-jss';
import { t_global_text_color_regular } from '@patternfly/react-tokens';

interface Props {
  isLink?: boolean;
  children?: React.ReactNode;
}

const useStyles = ({ isLink }: Props) =>
  createUseStyles({
    fontStyle: {
      fontSize: '14px',
      ...(isLink
        ? {
            textDecoration: 'grey dotted underline',
            cursor: 'pointer',
          }
        : {}),
      color: t_global_text_color_regular.var,
    },
  });

const StatusText = (props: Props) => {
  const classes = useStyles(props)();
  const { children } = props;

  return <span className={classes.fontStyle}>{children}</span>;
};

export default StatusText;
