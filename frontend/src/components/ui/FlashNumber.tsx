import { useRef, useEffect, useState } from 'react';

interface FlashNumberProps {
  value: number;
  format?: (v: number) => string;
  positiveGreen?: boolean;
  className?: string;
}

export const FlashNumber = ({
  value,
  format = (v) => v.toFixed(2),
  positiveGreen = false,
  className = '',
}: FlashNumberProps) => {
  const prevRef = useRef<number>(value);
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);

  useEffect(() => {
    if (prevRef.current !== value) {
      const isUp = value > prevRef.current;
      setFlash(isUp ? 'green' : 'red');
      prevRef.current = value;
      const timer = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const colorClass = positiveGreen
    ? value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-gray-300'
    : 'text-gray-100';

  const flashClass = flash === 'green' ? 'value-flash-green' : flash === 'red' ? 'value-flash-red' : '';

  return (
    <span className={`${colorClass} ${flashClass} ${className} inline-block`}>
      {format(value)}
    </span>
  );
};
