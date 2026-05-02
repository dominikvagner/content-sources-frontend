import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IAction } from '@patternfly/react-table';
import { TooltipPosition } from '@patternfly/react-core';
import { createUseStyles } from 'react-jss';
import { ContentOrigin } from 'services/Content/ContentApi';
import { useAppContext } from 'middleware/AppContext';
import { EDIT_ROUTE, UPLOAD_ROUTE, DELETE_ROUTE } from 'Routes/constants';
import type { ActionRowData } from '../components/RepositoryActionCell';

const useStyles = createUseStyles({
  disabledButton: {
    pointerEvents: 'auto',
    cursor: 'default',
  },
});

export const showPendingTooltip = (
  snapshotStatus: string | undefined,
  introspectStatus: string | undefined,
) => {
  if (!snapshotStatus && !introspectStatus) {
    return 'Introspection or snapshotting is in progress';
  } else if (snapshotStatus === 'running' || snapshotStatus === 'pending') {
    return 'Snapshotting is in progress';
  } else if (introspectStatus === 'Pending') {
    return 'Introspection is in progress';
  }
};

interface UseRowActionsProps {
  isRedHatRepository: boolean;
  introspectRepoForUuid: (uuid: string) => Promise<void>;
  triggerIntrospectionAndSnapshot: (uuid: string) => Promise<void>;
  clearSelectedRepositories: () => void;
}

export default function useRowActions({
  isRedHatRepository,
  introspectRepoForUuid,
  triggerIntrospectionAndSnapshot,
  clearSelectedRepositories,
}: UseRowActionsProps) {
  const navigate = useNavigate();
  const { rbac, features } = useAppContext();
  const classes = useStyles();

  const rowActions = useCallback(
    (rowData: ActionRowData): IAction[] =>
      isRedHatRepository ||
      rowData.origin === ContentOrigin.REDHAT ||
      rowData.origin === ContentOrigin.COMMUNITY
        ? features?.snapshots?.accessible
          ? [
              {
                isDisabled: !rowData.snapshot || !(rowData.snapshot && rowData.last_snapshot_uuid),

                ouiaId: 'kebab_view_snapshots',
                title:
                  rowData.snapshot && rowData.last_snapshot_uuid
                    ? 'View all snapshots'
                    : 'No snapshots yet',
                onClick: () => {
                  navigate(`${rowData.uuid}/snapshots`);
                },
              },
            ]
          : []
        : [
            ...(rbac?.repoWrite
              ? [
                  {
                    isDisabled: rowData?.status === 'Pending',
                    title: 'Edit',
                    ouiaId: 'kebab_edit',
                    onClick: () => {
                      navigate(`${rowData.uuid}/${EDIT_ROUTE}`);
                    },
                  },
                  ...(rowData.origin === ContentOrigin.UPLOAD
                    ? [
                        {
                          isDisabled: rowData?.status === 'Pending',
                          title: 'Upload content',
                          ouiaId: 'kebab_upload_content',
                          onClick: () => {
                            navigate(`${rowData.uuid}/${UPLOAD_ROUTE}`);
                          },
                        },
                      ]
                    : []),
                ]
              : []),
            ...(features?.snapshots?.accessible
              ? [
                  {
                    isDisabled: !rowData.last_snapshot_uuid,
                    title: rowData.last_snapshot_uuid ? 'View all snapshots' : 'No snapshots yet',
                    ouiaId: 'kebab_view_snapshots',
                    onClick: () => {
                      navigate(`${rowData.uuid}/snapshots`);
                    },
                  },
                  ...(rbac?.repoWrite && rowData.origin !== ContentOrigin.UPLOAD
                    ? [
                        {
                          id: 'actions-column-snapshot',
                          className:
                            rowData?.status === 'Pending' || !rowData.snapshot
                              ? classes.disabledButton
                              : '',
                          isDisabled: rowData?.status === 'Pending' || !rowData.snapshot,
                          title: 'Trigger snapshot',
                          ouiaId: 'kebab_trigger_snapshots',
                          onClick: () => {
                            triggerIntrospectionAndSnapshot(rowData?.uuid);
                          },
                          tooltipProps: !rowData.snapshot
                            ? {
                                content: 'Snapshots disabled for this repository.',
                                position: TooltipPosition.left,
                                triggerRef: () =>
                                  document.getElementById('actions-column-snapshot') ||
                                  document.body,
                              }
                            : undefined,
                        },
                      ]
                    : []),
                ]
              : []),
            ...(rbac?.repoWrite && !rowData?.snapshot
              ? [
                  {
                    isDisabled: rowData?.status == 'Pending',
                    title: 'Introspect now',
                    ouiaId: 'kebab_introspect_now',
                    onClick: () =>
                      introspectRepoForUuid(rowData?.uuid).then(clearSelectedRepositories),
                  },
                ]
              : []),
            ...(rbac?.repoWrite
              ? [
                  { isSeparator: true },
                  {
                    title: 'Delete',
                    ouiaId: 'kebab_delete',
                    onClick: () => navigate(`${DELETE_ROUTE}?repoUUID=${rowData.uuid}`),
                  },
                ]
              : []),
          ],
    [
      isRedHatRepository,
      features?.snapshots?.accessible,
      rbac?.repoWrite,
      navigate,
      triggerIntrospectionAndSnapshot,
      introspectRepoForUuid,
      clearSelectedRepositories,
      classes.disabledButton,
    ],
  );

  return { rowActions, showPendingTooltip };
}
