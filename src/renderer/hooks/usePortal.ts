import * as React from 'react';

export function usePortal(parent: HTMLElement): HTMLDivElement {
  const element = React.useRef<HTMLDivElement | null>(null);

  if (!element.current) {
    element.current = document.createElement('div');
  }

  React.useEffect(() => {
    if (element.current) { parent.appendChild(element.current); }
    return () => {
      if (element.current) { element.current.remove(); }
    };
  });

  return element.current;
}
