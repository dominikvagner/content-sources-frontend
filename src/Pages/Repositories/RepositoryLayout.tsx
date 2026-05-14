import { useMemo } from 'react';
import { Grid, Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { createUseStyles } from 'react-jss';
import { last } from 'lodash';
import Header from 'components/Header/Header';
import RepositoryQuickStart from 'components/QuickStart/RepositoryQuickStart';
import ServiceUnavailableAlert from 'components/ServiceUnavailableAlert/ServiceUnavailableAlert';
import {
  ADMIN_TASKS_ROUTE,
  REDHAT_REPO_GEN_ROUTE,
  REPOSITORIES_ROUTE,
} from '../../Routes/constants';
import { useAppContext } from 'middleware/AppContext';
import { useFlag } from '@unleash/proxy-client-react';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

const useStyles = createUseStyles({
  link: {
    all: 'unset',
  },
});

export default function RepositoryLayout() {
  const { pathname } = useLocation();
  const { features } = useAppContext();
  const serviceUnavailable = useFlag('content-sources.service-unavailable');
  const classes = useStyles();
  const currentRoute = useMemo(() => last(pathname.split('/')), [pathname]);

  const tabs = useMemo(
    () => [
      { title: 'Your repositories', route: '', key: REPOSITORIES_ROUTE },
      ...(features?.admintasks?.enabled && features.admintasks?.accessible
        ? [
            {
              title: 'Admin tasks',
              route: ADMIN_TASKS_ROUTE,
              key: ADMIN_TASKS_ROUTE,
            },
            {
              title: 'Admin features',
              route: REDHAT_REPO_GEN_ROUTE,
              key: REDHAT_REPO_GEN_ROUTE,
            },
          ]
        : []),
    ],
    [features],
  );

  return (
    <>
      <Header
        title='Repositories'
        ouiaId='custom_repositories_description'
        paragraph='View all repositories within your organization.'
      />
      {serviceUnavailable && <ServiceUnavailableAlert />}
      {tabs.length > 1 ? (
        <div className={spacing.pxLg}>
          <Tabs ouiaId='routed-tabs' activeKey={currentRoute}>
            {tabs.map(({ title, route, key }) => (
              <Tab
                keyParams={route}
                key={key}
                tabIndex={-1} // This prevents the tab from being targetable by accessibility features.
                eventKey={key}
                aria-label={title}
                ouiaId={title}
                title={
                  <Link className={classes.link} accessKey={key} key={key} to={route}>
                    <TabTitleText>{title}</TabTitleText>
                  </Link>
                }
              />
            ))}
          </Tabs>
        </div>
      ) : null}
      <RepositoryQuickStart />
      <Grid>
        <Outlet />
      </Grid>
    </>
  );
}
