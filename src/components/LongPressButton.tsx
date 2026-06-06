import { useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 800;
const MOVE_CANCEL_PX = 10;

type LongPressButtonProps = {
  className: string;
  label: string;
  pressingLabel: string;
  onLongPress: () => void;
};

export function LongPressButton({
  className,
  label,
  pressingLabel,
  onLongPress,
}: LongPressButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const longPressCompletedRef = useRef(false);
  const ignoreNextClickRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  function clearTimer(): void {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function releasePointerCapture(
    button: HTMLButtonElement,
    pointerId: number,
  ): void {
    try {
      if (button.hasPointerCapture(pointerId)) {
        button.releasePointerCapture(pointerId);
      }
    } catch {
      // The browser may release capture before pointercancel is delivered.
    }
  }

  function finishPress(
    button: HTMLButtonElement,
    pointerId: number,
  ): void {
    clearTimer();
    releasePointerCapture(button, pointerId);
    pointerIdRef.current = null;
    longPressCompletedRef.current = false;
    setIsPressing(false);
  }

  function cancelPress(
    button: HTMLButtonElement,
    pointerId: number,
  ): void {
    longPressCompletedRef.current = false;
    ignoreNextClickRef.current = false;
    finishPress(button, pointerId);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    const isPrimaryMouseButton =
      event.pointerType !== "mouse" || event.button === 0;

    if (
      !event.isPrimary ||
      !isPrimaryMouseButton ||
      pointerIdRef.current !== null
    ) {
      return;
    }

    clearTimer();
    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    longPressCompletedRef.current = false;
    ignoreNextClickRef.current = false;
    setIsPressing(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Keep the timer active on browsers that cannot capture this pointer.
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;

      if (
        pointerIdRef.current !== event.pointerId ||
        longPressCompletedRef.current
      ) {
        return;
      }

      longPressCompletedRef.current = true;
      ignoreNextClickRef.current = true;
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (
      event.pointerId !== pointerIdRef.current ||
      longPressCompletedRef.current
    ) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - startXRef.current,
      event.clientY - startYRef.current,
    );

    if (distance > MOVE_CANCEL_PX) {
      cancelPress(event.currentTarget, event.pointerId);
    }
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (event.pointerId !== pointerIdRef.current) {
      return;
    }

    const shouldRunLongPress = longPressCompletedRef.current;

    if (shouldRunLongPress) {
      event.preventDefault();
    }

    finishPress(event.currentTarget, event.pointerId);

    if (shouldRunLongPress) {
      onLongPress();
    }
  }

  function handlePointerCancel(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (event.pointerId !== pointerIdRef.current) {
      return;
    }

    cancelPress(event.currentTarget, event.pointerId);
  }

  useEffect(() => {
    return () => {
      clearTimer();

      const button = buttonRef.current;
      const pointerId = pointerIdRef.current;

      if (button && pointerId !== null) {
        releasePointerCapture(button, pointerId);
      }
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${className} long-press-button${isPressing ? " pressing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => {
        if (!ignoreNextClickRef.current) {
          return;
        }

        ignoreNextClickRef.current = false;
        event.preventDefault();
      }}
    >
      {isPressing ? pressingLabel : label}
    </button>
  );
}
