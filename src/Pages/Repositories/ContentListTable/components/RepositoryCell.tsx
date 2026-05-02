import { memo } from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import dayjs from 'dayjs';
import { ContentItem, ContentOrigin } from 'services/Content/ContentApi';
import Hide from 'components/Hide/Hide';
import UploadRepositoryLabel from 'components/RepositoryLabels/UploadRepositoryLabel';
import CommunityRepositoryLabel from 'components/RepositoryLabels/CommunityRepositoryLabel';
import CustomEpelWarning from 'components/RepositoryLabels/CustomEpelWarning';
import UrlWithExternalIcon from 'components/UrlWithLinkIcon/UrlWithLinkIcon';
import ChangedArrows from './SnapshotListModal/components/ChangedArrows';
import { isEPELUrl } from 'helpers';

interface Props {
  rowData: Pick<ContentItem, 'name' | 'url' | 'last_snapshot' | 'origin'>;
  snapshotsAccessible: boolean;
  communityReposEnabled: boolean;
}

const RepositoryCell = memo(({ rowData, snapshotsAccessible, communityReposEnabled }: Props) => {
  const { name, url, last_snapshot, origin } = rowData;

  return (
    <Flex direction={{ default: 'column' }}>
      <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>{name}</FlexItem>
        <Hide hide={origin !== ContentOrigin.UPLOAD}>
          <UploadRepositoryLabel />
        </Hide>
        <Hide hide={origin !== ContentOrigin.COMMUNITY}>
          <CommunityRepositoryLabel />
        </Hide>
        <Hide
          hide={!(origin === ContentOrigin.EXTERNAL && isEPELUrl(url)) || !communityReposEnabled}
        >
          <CustomEpelWarning />
        </Hide>
      </Flex>

      <Hide hide={origin === ContentOrigin.UPLOAD}>
        <UrlWithExternalIcon href={url} />
      </Hide>

      <Hide hide={!snapshotsAccessible}>
        <Flex gap={{ default: 'gapMd' }}>
          <FlexItem>
            {last_snapshot
              ? `Last snapshot ${dayjs(last_snapshot?.created_at).fromNow()}`
              : 'No snapshot yet'}
          </FlexItem>
          <Hide hide={!last_snapshot}>
            <Flex gap={{ default: 'gapXs' }}>
              <FlexItem>Changes:</FlexItem>
              <FlexItem>
                <ChangedArrows
                  addedCount={last_snapshot?.added_counts?.['rpm.package'] || 0}
                  removedCount={last_snapshot?.removed_counts?.['rpm.package'] || 0}
                />
              </FlexItem>
            </Flex>
          </Hide>
        </Flex>
      </Hide>
    </Flex>
  );
});

RepositoryCell.displayName = 'RepositoryCell';

export default RepositoryCell;
