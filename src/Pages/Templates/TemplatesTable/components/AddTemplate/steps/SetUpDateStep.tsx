import {
  Alert,
  DatePicker,
  FormAlert,
  FormGroup,
  Grid,
  Radio,
  Text,
  TextVariants,
  Title,
} from '@patternfly/react-core';
import { useAddTemplateContext } from '../AddTemplateContext';
import { useContentListQuery, useGetSnapshotsByDates } from 'services/Content/ContentQueries';
import { useEffect, useMemo } from 'react';
import { global_Color_400 } from '@patternfly/react-tokens';
import Hide from 'components/Hide/Hide';
import { ContentOrigin } from 'services/Content/ContentApi';
import { formatDateForPicker, formatTemplateDate, isDateValid } from 'helpers';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  snapshotInfoText: {
    color: global_Color_400.value,
    marginRight: '16px',
  },
  whatDoesItMean: {
    paddingTop: '16px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
});

export default function SetUpDateStep() {
  const classes = useStyles();

  const { templateRequest, setTemplateRequest, selectedRedhatRepos, selectedCustomRepos } =
    useAddTemplateContext();

  const { data, mutateAsync } = useGetSnapshotsByDates(
    [...selectedRedhatRepos, ...selectedCustomRepos],
    formatTemplateDate(templateRequest?.date || ''),
  );

  useEffect(() => {
    setTemplateRequest({
      ...templateRequest,
      date: templateRequest ? formatDateForPicker(templateRequest.date) : '',
    });
  }, []);

  const dateValidators = [
    (date: Date) => {
      if (date.getTime() > Date.now()) {
        return 'Cannot set a date in the future';
      }
      return '';
    },
  ];

  const dateIsValid = useMemo(
    () => isDateValid(templateRequest?.date || ''),
    [templateRequest?.date],
  );

  useEffect(() => {
    if (
      templateRequest?.date &&
      dateIsValid &&
      [...selectedRedhatRepos, ...selectedCustomRepos].length
    ) {
      mutateAsync();
    }
  }, [selectedRedhatRepos.size, selectedCustomRepos.size, templateRequest?.date]);

  const itemsAfterDate = useMemo(
    () => data?.data?.filter(({ is_after }) => is_after) || [],
    [data?.data],
  );

  const hasIsAfter = itemsAfterDate.length > 0;

  const { isLoading, data: contentData = { data: [], meta: { count: 0, limit: 20, offset: 0 } } } =
    useContentListQuery(
      1,
      100,
      {
        uuids: itemsAfterDate.map(({ repository_uuid }) => repository_uuid),
      },
      '',
      ContentOrigin.ALL,
    );

  return (
    <Grid hasGutter>
      <Title ouiaId='set_up_date' headingLevel='h1'>
        Set up date
      </Title>
      <Text component={TextVariants.h6}>
        This will include snapshots up to a specific date. Content of the snapshots created after
        the selected date will be displayed as applicable, not installable.
      </Text>
      <Text component={TextVariants.h6}>
        <b>Select date for snapshotted repositories</b>
      </Text>
      <FormGroup className={classes.radioGroup}>
        <Radio
          id='use latest snapshot radio'
          ouiaId='use-latest-snapshot-radio'
          name='use-latest-snapshot'
          label='Use latest content'
          description='Always use latest content from repositories. Snapshots may be updated daily.'
          isChecked={templateRequest.use_latest}
          onChange={() => {
            if (!templateRequest.use_latest) {
              setTemplateRequest((prev) => ({ ...prev, use_latest: true, date: '' }));
            }
          }}
        />
        <Radio
          id='use snapshot date radio'
          ouiaId='use-snapshot-date-radio'
          name='use-snapshot-date'
          label='Use up to specific date'
          description='Includes repository changes up to this date.'
          isChecked={!templateRequest.use_latest}
          onChange={() => {
            if (templateRequest.use_latest) {
              setTemplateRequest((prev) => ({ ...prev, use_latest: false, date: '' }));
            }
          }}
        />
        <DatePicker
          value={templateRequest.date ?? ''}
          required
          requiredDateOptions={{ isRequired: true }}
          style={{ paddingLeft: '20px' }}
          validators={dateValidators}
          popoverProps={{
            position: 'right',
            enableFlip: true,
            flipBehavior: ['right', 'right-start', 'right-end', 'top-start', 'top'],
          }}
          onChange={(_, val) => {
            setTemplateRequest((prev) => ({ ...prev, date: val }));
          }}
          // defaultValue={templateRequest.date ?? undefined}
        />
      </FormGroup>
      <Hide hide={!hasIsAfter || !dateIsValid}>
        <FormAlert>
          <Alert
            variant='warning'
            title='Selected date doesn’t include the only snapshot of some selected repositories.'
            isInline
          >
            <Hide hide={isLoading}>
              {contentData.data?.reduce((acc, current, index, array) => {
                const { name } = current;
                if (index != 0 && index + 1 === array.length) {
                  acc += `and "${name}" `;
                } else if (array.length === 1) {
                  acc += `"${name}" `;
                } else {
                  acc += `"${name}", `;
                }

                if (index + 1 == array.length) {
                  acc += array.length === 1 ? 'repository ' : 'repositories ';
                  acc += 'will be included anyway.';
                }
                return acc;
              }, 'The content of the ')}
            </Hide>
          </Alert>
        </FormAlert>
      </Hide>
    </Grid>
  );
}
