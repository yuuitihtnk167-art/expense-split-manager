import { useRef, useState } from "react";

const LONG_PRESS_DURATION = 800;

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
  const timerRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  function cancelPress(): void {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsPressing(false);
  }

  function startPress(): void {
    cancelPress();
    setIsPressing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setIsPressing(false);
      onLongPress();
    }, LONG_PRESS_DURATION);
  }

  return (
    <button
      type="button"
      className={`${className} long-press-button${isPressing ? " pressing" : ""}`}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onPointerLeave={cancelPress}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => event.preventDefault()}
    >
      {isPressing ? pressingLabel : label}
    </button>
  );
}
