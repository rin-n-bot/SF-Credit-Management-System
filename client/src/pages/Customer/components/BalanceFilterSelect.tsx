import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BalanceFilterSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

export default function BalanceFilterSelect({ value, onChange, options }: BalanceFilterSelectProps) {
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
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`h-[38px] min-w-[130px] border border-[#dce0ea] rounded-[6px] px-3 text-[13px] font-bold bg-white text-[#12172a] cursor-pointer flex items-center justify-between gap-2 ${open ? 'border-[#5b50e6]' : ''}`}
      >
        {selected?.label}
        <span className={`inline-block text-[16px] text-[#5f667a] transition-transform duration-150 ${open ? 'rotate-90' : '-rotate-90'}`}>
          ‹
        </span>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width }}
          className="bg-white border border-[#dce0ea] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-[1000] overflow-hidden"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`block w-full px-[14px] py-[9px] text-left text-[13px] font-semibold border-0 cursor-pointer ${opt.value === value ? 'bg-[#141414] text-white' : 'bg-white text-[#12172a] hover:text-[#5b50e6]'}`}
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