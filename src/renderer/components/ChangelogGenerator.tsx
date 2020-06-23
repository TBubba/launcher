import { LangContext } from '@renderer/util/lang';
import * as React from 'react';
import { FullscreenOverlay } from './FullscreenOverlay';

export type ChangelogGeneratorConfirmData = {
  /** (YYYY-MM-DD) */
  startDate: string;
  /** (YYYY-MM-DD) */
  endDate: string;
}

type ChangelogGeneratorProps = {
  /** Called when the user attempts to cancel/close the "popup". */
  onCancel: () => void;
  /** Called when the user attempts to confirm the export. */
  onConfirm: (data: ChangelogGeneratorConfirmData) => void;
}

export function ChangelogGenerator(props: ChangelogGeneratorProps) {
  const strings = React.useContext(LangContext);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState(() => dateToYYYYMMDD(new Date()));

  const is_end_before_start = React.useMemo(() => {
    const end = YYYYMMDDtoDate(endDate);
    const start = YYYYMMDDtoDate(startDate);

    return (end.getTime() - start.getTime()) < 0;
  }, [startDate, endDate]);

  const onStartDateChange = useSetDateWrapper(setStartDate);
  const onEndDateChange = useSetDateWrapper(setEndDate);

  const onClickConfirm = React.useCallback((event: React.MouseEvent) => {
    props.onConfirm({
      startDate: startDate,
      endDate: endDate,
    });
  }, [props.onConfirm, startDate, endDate]);

  // Render
  return (
    <FullscreenOverlay
      onCancel={props.onCancel}
      classNameInner='some-box-thing changelog-generator'>
      <p className='some-box-thing__title'>{strings.misc.generateChangelogTitle}</p>
      <div className='some-box-thing__rows'>
        {/* Start Date */}
        <div className='some-box-thing__row'>{strings.misc.generateChangelogStartDate}</div>
        <div className='some-box-thing__row'>
          <input
            type='date'
            className='some-box-thing__row-title'
            value={startDate}
            onChange={onStartDateChange} />
        </div>
        <div className='some-box-thing__row-break' />
        {/* End Date */}
        <div className='some-box-thing__row'>{strings.misc.generateChangelogEndDate}</div>
        <div className='some-box-thing__row'>
          <input
            type='date'
            className='some-box-thing__row-title'
            value={endDate}
            onChange={onEndDateChange} />
        </div>
      </div>
      {/* Error */}
      { is_end_before_start ? (
        <div className='some-box-thing__rows some-box-thing__rows--error'>
          <div className='some-box-thing__row'>
            <p>{strings.misc.generateChangelogEndBeforeStartError}</p>
          </div>
        </div>
      ) : undefined }
      {/* Confirm */}
      <input
        type='button'
        className='simple-button'
        disabled={is_end_before_start || (startDate === '') || (endDate === '')}
        value={strings.misc.generateChangelogConfirm}
        onClick={onClickConfirm} />
    </FullscreenOverlay>
  );
}

function useSetDateWrapper(setDate: (value: React.SetStateAction<string>) => void) {
  return React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
  }, [setDate]);
}

/** Convert a date to a YYYY-MM-DD string (UTC). */
function dateToYYYYMMDD(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`;

  function pad(num: number, length: number): string {
    const str = num + '';
    return '0'.repeat(Math.max(0, length - str.length)) + str;
  }
}

/** Convert a date to a YYYY-MM-DD string (UTC). */
function YYYYMMDDtoDate(str: string): Date {
  const date = new Date();
  date.setUTCFullYear(+str.substr(0, 4), (+str.substr(5, 2)) - 1, +str.substr(8, 2));
  return date;
}
