import { usePortal } from '@renderer/hooks/usePortal';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

export type FullscreenOverlayProps = {
  /** Called when the background is clicked. This usually means that the user wants to close the overlay. */
  onCancel?: () => void;
  className?: string;
  classNameOuter?: string;
  classNameInner?: string;
  children?: React.ReactNode;
}

export function FullscreenOverlay(props: FullscreenOverlayProps) {
  const portal = usePortal(document.body);

  const onClickBackground = React.useCallback((event: React.MouseEvent) => {
    if (props.onCancel && event.target === event.currentTarget) {
      event.preventDefault();
      props.onCancel();
    }
  }, [props.onCancel]);

  let className = 'fullscreen-overlay';
  if (props.className) { className += ' ' + props.className; }

  let classNameOuter = 'fullscreen-overlay__outer simple-center';
  if (props.classNameOuter) { classNameOuter += ' ' + props.classNameOuter; }

  let classNameInner = 'fullscreen-overlay__inner simple-center__inner simple-center__vertical-inner';
  if (props.classNameInner) { classNameInner += ' ' + props.classNameInner; }

  return ReactDOM.createPortal((
    <div
      className={className}
      onClick={onClickBackground}>
      <div
        className={classNameOuter}
        onClick={onClickBackground}>
        <div className={classNameInner}>
          {props.children}
        </div>
      </div>
    </div>
  ), portal);
}
