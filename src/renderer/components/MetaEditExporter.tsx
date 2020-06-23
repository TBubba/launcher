import { LangContext } from '@renderer/util/lang';
import { LangContainer } from '@shared/lang';
import { MetaEditFlags } from '@shared/MetaEdit';
import * as React from 'react';
import { FullscreenOverlay } from './FullscreenOverlay';

export type MetaEditExporterConfirmData = {
  id: string;
  properties: MetaEditFlags;
}

type MetaEditExporterProps = {
  /** ID of the game being exported. */
  gameId: string;
  /** Called when the user attempts to cancel/close the "popup". */
  onCancel: () => void;
  /** Called when the user attempts to confirm the export. */
  onConfirm: (data: MetaEditExporterConfirmData) => void;
}

export function MetaEditExporter(props: MetaEditExporterProps) {
  const strings = React.useContext(LangContext);
  const [properties, setProperties] = React.useState(initProperties);

  const onClickConfirm = React.useCallback((event: React.MouseEvent) => {
    props.onConfirm({
      id: props.gameId,
      properties,
    });
  }, [props.onConfirm, props.gameId, properties]);

  // Render properties
  const keys = Object.keys(properties) as (keyof typeof properties)[];
  const propertiesElements = keys.map((key) => {
    const val = properties[key];
    return (
      <div
        key={key}
        className='some-box-thing__row'
        onClick={() => setProperties({ ...properties, [key]: !val })}>
        <input
          type='checkbox'
          className='meta-edit-exporter__row-checkbox'
          readOnly={true}
          checked={val} />
        <p className='meta-edit-exporter__row-title'>{getGameString(key, strings)}</p>
      </div>
    );
  });

  // Render
  return (
    <FullscreenOverlay
      onCancel={props.onCancel}
      classNameInner='meta-edit-exporter some-box-thing simple-scroll'>
      <p className='meta-edit-exporter__title'>{strings.misc.exportMetaEditTitle}</p>
      <p>{strings.misc.exportMetaEditDesc}</p>
      <div className='some-box-thing__rows'>
        {propertiesElements}
      </div>
      <input
        type='button'
        className='simple-button'
        value='Export'
        onClick={onClickConfirm} />
    </FullscreenOverlay>
  );
}

function initProperties(): MetaEditFlags {
  return {
    title: false,
    alternateTitles: false,
    series: false,
    developer: false,
    publisher: false,
    tags: false,
    platform: false,
    broken: false,
    extreme: false,
    playMode: false,
    status: false,
    notes: false,
    source: false,
    applicationPath: false,
    launchCommand: false,
    releaseDate: false,
    version: false,
    originalDescription: false,
    language: false,
    library: false,
  };
}

function getGameString(key: keyof MetaEditFlags, strings: LangContainer): string {
  // @TODO Put all the strings for the different properties/field of a Game into the
  //       same place, instead of having them spread out?
  switch (key) {
    default:                    return key;
    case 'title':               return strings.filter.title;
    case 'alternateTitles':     return strings.browse.alternateTitles;
    case 'series':              return strings.browse.series;
    case 'developer':           return strings.filter.developer;
    case 'publisher':           return strings.browse.publisher;
    case 'tags':                return strings.browse.tags;
    case 'platform':            return strings.browse.platform;
    case 'broken':              return strings.browse.brokenInInfinity;
    case 'extreme':             return strings.browse.extreme;
    case 'playMode':            return strings.browse.playMode;
    case 'status':              return strings.browse.status;
    case 'notes':               return strings.browse.notes;
    case 'source':              return strings.browse.source;
    case 'applicationPath':     return strings.browse.applicationPath;
    case 'launchCommand':       return strings.browse.launchCommand;
    case 'releaseDate':         return strings.browse.releaseDate;
    case 'version':             return strings.browse.version;
    case 'originalDescription': return strings.browse.originalDescription;
    case 'language':            return strings.browse.language;
    case 'library':             return strings.browse.library;
  }
}
