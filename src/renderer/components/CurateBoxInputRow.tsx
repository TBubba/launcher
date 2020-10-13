import { CurateBoxRow } from '@renderer/components/CurateBoxRow';
import { InputElement, InputField } from '@renderer/components/InputField';
import { CurateActionType } from '@renderer/store/curate/enums';
import { CurateAction } from '@renderer/store/curate/types';
import { CurationMeta } from '@shared/curate/types';
import * as React from 'react';
import { Dispatch } from 'redux';
import { DropdownInputField } from './DropdownInputField';

export type CurateBoxInputRowProps = {
  title: string;
  text?: string;
  placeholder?: string;
  property: keyof CurationMeta;
  multiline?: boolean;
  curationFolder: string;
  disabled: boolean;
  dispatch: Dispatch<CurateAction>;
}

export function CurateBoxInputRow(props: CurateBoxInputRowProps) {
  const onChange = useOnInputChange(props.property, props.curationFolder, props.dispatch);

  return (
    <CurateBoxRow title={props.title + ':'}>
      <InputField
        text={props.text || ''}
        placeholder={props.placeholder}
        onChange={onChange}
        disabled={props.disabled}
        multiline={props.multiline}
        editable={true} />
    </CurateBoxRow>
  );
}

export type CurateBoxDropdownInputRowProps = CurateBoxInputRowProps & {
  className?: string;
  items?: string[];
}

export function CurateBoxDropdownInputRow(props: CurateBoxDropdownInputRowProps) {
  const onChange = useOnInputChange(props.property, props.curationFolder, props.dispatch);
  const onItemSelect = useTransformOnItemSelect(onChange);

  return (
    <CurateBoxRow title={props.title + ':'}>
      <DropdownInputField
        className={props.className}
        items={props.items || []}
        onItemSelect={onItemSelect}
        text={props.text || ''}
        placeholder={props.placeholder}
        onChange={onChange}
        disabled={props.disabled}
        multiline={props.multiline}
        editable={true} />
    </CurateBoxRow>
  );
}

/** Subset of the input elements on change event, with only the properties used by the callbacks. */
type InputElementOnChangeEvent = {
  currentTarget: {
    value: React.ChangeEvent<InputElement>['currentTarget']['value']
  }
}

function useOnInputChange(property: keyof CurationMeta, folder: string | undefined, dispatch: Dispatch<CurateAction>) {
  return React.useCallback((event: InputElementOnChangeEvent) => {
    if (folder !== undefined) {
      dispatch({
        type: CurateActionType.EDIT_CURATION_META,
        folder: folder,
        property: property,
        value: event.currentTarget.value,
      });
    }
  }, [dispatch, folder]);
}

function useTransformOnItemSelect(callback: (event: InputElementOnChangeEvent) => void) {
  return React.useCallback((text: string) => {
    callback({ currentTarget: { value: text } });
  }, [callback]);
}