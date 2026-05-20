import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BalanceFilterSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

export default function BalanceFilterSelect({
  value,
  onChange,
  options,
}: BalanceFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleOpen() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleScroll() { setOpen(false); }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button ref={btnRef} className={`filter-select-btn${open ? ' open' : ''}`} type="button" onClick={handleOpen}>
        {selected?.label}
        <span className="filter-chevron">‹</span>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="filter-dropdown"
          style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={opt.value === value ? 'active' : ''}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
