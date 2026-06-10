import {
  Button,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
  Tab,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import { InnerScrollContainer } from '@patternfly/react-table';
import { ContentOrigin } from 'services/Content/ContentApi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useRootPath from 'Hooks/useRootPath';
import { useAppContext } from 'middleware/AppContext';
import { useEffect, useState } from 'react';
import { SnapshotPackagesTab } from './Tabs/SnapshotPackagesTab';
import { createUseStyles } from 'react-jss';
import { SnapshotSelector } from './SnapshotSelector';
import { REPOSITORIES_ROUTE } from 'Routes/constants';
import { SnapshotErrataTab } from './Tabs/SnapshotErrataTab';
import { SnapshotChangesTab } from './Tabs/SnapshotChangesTab';
import { modalTableSurfaceStyles } from 'helpers';

const useStyles = createUseStyles({
  modalTableScope: modalTableSurfaceStyles,
  modalBody: {
    padding: '24px 24px 0 24px',
  },
  topContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    '& button': { maxHeight: '37px', marginTop: 'auto' },
  },
});

export enum SnapshotDetailTab {
  PACKAGES = 'packages',
  CHANGES = 'changes',
  ERRATA = 'errata',
}

const isSnapshotDetailTab = (value: string | null): value is SnapshotDetailTab =>
  Object.values(SnapshotDetailTab).includes(value as SnapshotDetailTab);

export default function SnapshotDetailsModal() {
  const { contentOrigin } = useAppContext();
  const classes = useStyles();
  const { repoUUID, snapshotUUID } = useParams();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const rootPath = useRootPath();
  const navigate = useNavigate();
  const activeTab = urlSearchParams.get('tab');
  const [activeTabKey, setActiveTabKey] = useState<SnapshotDetailTab>(SnapshotDetailTab.PACKAGES);

  useEffect(() => {
    setActiveTabKey(isSnapshotDetailTab(activeTab) ? activeTab : SnapshotDetailTab.PACKAGES);
  }, [activeTab]);

  const handleTabClick = (
    _: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: string | number,
  ) => {
    const selectedTab = isSnapshotDetailTab(String(tabIndex))
      ? (tabIndex as SnapshotDetailTab)
      : SnapshotDetailTab.PACKAGES;
    setUrlSearchParams(selectedTab === SnapshotDetailTab.PACKAGES ? {} : { tab: selectedTab });
    setActiveTabKey(selectedTab);
  };

  const onClose = () =>
    navigate(
      `${rootPath}/${REPOSITORIES_ROUTE}` +
        (contentOrigin.length === 1 && contentOrigin[0] === ContentOrigin.REDHAT
          ? `?origin=${contentOrigin}`
          : ''),
    );

  const onBackClick = () => navigate(rootPath + `/${REPOSITORIES_ROUTE}/${repoUUID}/snapshots`);

  return (
    <Modal
      key={snapshotUUID}
      position='top'
      ouiaId='snapshot_details_modal'
      variant={ModalVariant.large}
      isOpen
      onClose={onClose}
      aria-labelledby='snapshot-details-modal-title'
    >
      <ModalHeader title='Snapshot detail' labelId='snapshot-details-modal-title' />
      <InnerScrollContainer>
        <Stack className={`${classes.modalTableScope} ${classes.modalBody}`}>
          <StackItem className={classes.topContainer}>
            <SnapshotSelector />
            <Button variant='secondary' onClick={onBackClick}>
              View all snapshots
            </Button>
          </StackItem>
          <StackItem>
            <Tabs
              activeKey={activeTabKey}
              onSelect={handleTabClick}
              aria-label='Snapshot detail tabs'
            >
              <Tab
                eventKey={SnapshotDetailTab.PACKAGES}
                ouiaId='packages_tab'
                title={<TabTitleText>Packages</TabTitleText>}
                aria-label='Snapshot package detail tab'
              >
                <SnapshotPackagesTab />
              </Tab>
              <Tab
                eventKey={SnapshotDetailTab.CHANGES}
                ouiaId='changes_tab'
                title={<TabTitleText>Changes</TabTitleText>}
                aria-label='Snapshot changes detail tab'
              >
                <SnapshotChangesTab />
              </Tab>
              <Tab
                eventKey={SnapshotDetailTab.ERRATA}
                ouiaId='advisories_tab'
                title={<TabTitleText>Advisories</TabTitleText>}
                aria-label='Snapshot errata detail tab'
              >
                <SnapshotErrataTab />
              </Tab>
            </Tabs>
          </StackItem>
        </Stack>
      </InnerScrollContainer>
      <ModalFooter>
        <Button
          key='close'
          variant='secondary'
          onClick={onClose}
          aria-label='Close snapshot detail'
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
