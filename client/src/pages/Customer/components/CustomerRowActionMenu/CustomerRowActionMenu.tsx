import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface CustomerRowActionMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CustomerRowActionMenu({
  onView,
  onEdit,
  onDelete,
}: CustomerRowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX,
    });
  }, []);

  function handleOpen() {
    updateCoords();
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

    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="action-dots"
        type="button"
        onClick={handleOpen}
      >
        ⋮
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="action-dropdown"
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-100%)',
          }}
        >
          <button type="button" onClick={() => { onView(); setOpen(false); }}>View</button>
          <button type="button" onClick={() => { onEdit(); setOpen(false); }}>Edit</button>
          <button type="button" className="danger" onClick={() => { onDelete(); setOpen(false); }}>Delete</button>
        </div>,
        document.body,
      )}
    </>
  );
}
