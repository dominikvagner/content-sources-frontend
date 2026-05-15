import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  MenuToggle,
} from '@patternfly/react-core';
import { createUseStyles } from 'react-jss';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetSnapshotList } from 'services/Content/ContentQueries';
import { useMemo, useState } from 'react';
import useRootPath from 'Hooks/useRootPath';
import { REPOSITORIES_ROUTE } from 'Routes/constants';
import { formatDateDDMMMYYYY } from 'helpers';

const useStyles = createUseStyles({
  mainContainer: {
    display: 'flex!important',
  },
  minWidth: {
    minWidth: '228px',
  },
});

export function SnapshotSelector() {
  const classes = useStyles();
  const rootPath = useRootPath();
  const navigate = useNavigate();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { repoUUID: uuid = '', snapshotUUID = '' } = useParams();

  const {
    isLoading,
    isFetching,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useGetSnapshotList(uuid as string, 1, 100, ''); // TODO: What do we do when a user has n+ snapshots?

  const [dateMapper, uuidMapper] = useMemo(() => {
    const dateMap = {};
    const uuidMap = {};
    data?.data.forEach(({ uuid, created_at }) => {
      const date = formatDateDDMMMYYYY(created_at, true);
      uuidMap[uuid] = date;
      dateMap[date] = uuid;
    });
    return [dateMap, uuidMap];
  }, [data?.data]);

  const setSelected = (selectedDate: string) => {
    navigate(`${rootPath}/${REPOSITORIES_ROUTE}/${uuid}/snapshots/${dateMapper[selectedDate]}`);
  };

  return (
    <Form isHorizontal>
      <FormGroup
        className={classes.mainContainer}
        label='Snapshots'
        aria-label='snapshot-selector'
        fieldId='snapshot'
      >
        <Dropdown
          isScrollable={true}
          onSelect={(_, val) => {
            setSelected(val as string);
            setSelectorOpen(false);
          }}
          toggle={(toggleRef) => (
            <MenuToggle
              className={classes.minWidth}
              ref={toggleRef}
              aria-label='snapshot selector'
              id='snapshotSelector'
              ouiaId='snapshot_selector'
              onClick={() => setSelectorOpen((prev) => !prev)}
              isDisabled={isLoading || isFetching}
              isExpanded={selectorOpen}
            >
              {uuidMapper[snapshotUUID] || 'Select a snapshot'}
            </MenuToggle>
          )}
          onOpenChange={(isOpen) => setSelectorOpen(isOpen)}
          isOpen={selectorOpen}
        >
          <DropdownList>
            {Object.keys(dateMapper).map((date) => (
              <DropdownItem
                key={date}
                value={date}
                isSelected={uuidMapper[snapshotUUID] === date}
                component='button'
                data-ouia-component-id={`filter_${date}`}
              >
                {date}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      </FormGroup>
    </Form>
  );
}
