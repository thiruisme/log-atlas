'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollPickerProps {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  suffix?: string;
  disabled?: boolean;
  title?: string;
}

export default function ScrollPicker({ value, options, onChange, suffix, disabled, title = "Select Value" }: ScrollPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const startY = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const openTimeRef = useRef<number>(0); // Timestamp when opened to prevent ghost clicks
  const [tempValue, setTempValue] = useState(value); // For optimistic UI during drag

  const popupRef = useRef<HTMLDivElement>(null);

  // Sync temp value
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // Scroll popup to selected value on open
  useEffect(() => {
    if (isOpen && popupRef.current) {
       const index = options.indexOf(value);
       if (index !== -1) {
           const itemHeight = 48; // Approx height of list item
           // Center it
           const containerHeight = popupRef.current.clientHeight;
           popupRef.current.scrollTop = (index * itemHeight) - (containerHeight / 2) + (itemHeight / 2);
       }
    }
  }, [isOpen, value, options]);

  // --- Virtual Gesture Logic ---

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    // Only left click or touch
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    lastY.current = e.clientY;
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    if (startY.current === null || lastY.current === null) return;

    const deltaY = lastY.current - e.clientY; // Positive = Drag Up, Negative = Drag Down
    const totalMove = Math.abs(e.clientY - startY.current);

    // Threshold to consider it a drag vs a click
    if (totalMove > 5) {
        isDragging.current = true;
    }

    if (isDragging.current) {
        e.preventDefault();
        
        // Sensitivity: pixels per step
        const step = 15; 
        
        if (Math.abs(deltaY) >= step) {
            const steps = Math.sign(deltaY) * Math.floor(Math.abs(deltaY) / step);
            // If steps != 0, we update
            if (steps !== 0) {
                const currentIndex = options.indexOf(tempValue);
                let newIndex = currentIndex + steps;
                
                // Clamp
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= options.length) newIndex = options.length - 1;
                
                const newValue = options[newIndex];
                if (newValue !== tempValue) {
                    setTempValue(newValue);
                    onChange(newValue);
                    lastY.current = e.clientY; // Reset reference for next step
                }
            }
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current && startY.current !== null) {
        // Was a tap
        setIsOpen(true);
        openTimeRef.current = Date.now();
        // Prevent default to stop compatibility mouse events (click)
        e.preventDefault();
    }
    startY.current = null;
    lastY.current = null;
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Wheel support for mouse users
  const handleWheel = (e: React.WheelEvent) => {
      if (disabled) return;
      // Prevent default page scroll if we can (passive listener issue in React, but let's try)
      // Actually standard wheel on a div usually scrolls page. 
      // We'll treat it as changing value.
      e.stopPropagation();
      
      const currentIndex = options.indexOf(value);
      const direction = e.deltaY > 0 ? 1 : -1; // Down = next, Up = prev
      
      let newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= options.length) newIndex = options.length - 1;
      
      const newValue = options[newIndex];
      if (newValue !== value) {
          onChange(newValue);
      }
  };

  return (
    <>
        {/* Inline Handle */}
        <div 
            className={`relative h-12 w-full bg-background border border-card-border rounded-xl flex items-center justify-center select-none touch-none transition-all group ${disabled ? 'opacity-50 cursor-not-allowed border-dashed' : 'cursor-ns-resize hover:border-accent/50 active:border-accent active:bg-accent/5'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} // Swallow compatibility clicks
        >
            <span className="text-xl font-bold font-mono tracking-tighter">
                {value === 0 ? '-' : value}
            </span>
            {suffix && value !== 0 && (
                <span className="text-[10px] text-text-muted font-bold ml-1 mt-1">{suffix}</span>
            )}

            {/* Hint Arrows (Visible on Hover/Active) */}
            <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-foreground"></div>
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-foreground"></div>
            </div>
        </div>

        {/* Popup Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200" 
                onPointerDown={(e) => {
                     // We use onPointerDown for the backdrop to catch the interaction earlier than onClick
                     // But we must check if it's the backdrop itself, not a child
                     if (e.target === e.currentTarget) {
                         if (Date.now() - openTimeRef.current < 400) return;
                         setIsOpen(false);
                     }
                }}
            >
                <div 
                    className="bg-card w-full max-w-sm max-h-[60vh] rounded-[2rem] border border-card-border shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 sm:zoom-in-95" 
                    onPointerDown={e => e.stopPropagation()} // Prevent close on inner click
                >
                    <div className="p-4 border-b border-card-border bg-card flex justify-between items-center">
                         <span className="text-sm font-black uppercase tracking-widest text-text-muted italic">{title}</span>
                         <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-text-muted hover:text-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                         </button>
                    </div>
                    <div 
                        ref={popupRef}
                        className="overflow-y-auto p-2 scrollbar-hide space-y-1"
                    >
                        {options.map(opt => (
                            <button
                                key={opt}
                                onClick={(e) => { 
                                    if (Date.now() - openTimeRef.current < 500) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                    }
                                    onChange(opt); 
                                    setIsOpen(false); 
                                }}
                                className={`w-full p-4 rounded-xl font-bold text-xl flex items-center justify-center transition-all ${opt === value ? 'bg-accent text-accent-foreground shadow-lg scale-[1.02]' : 'hover:bg-card-border/50 text-text-secondary'}`}
                            >
                                {opt === 0 ? 'None' : opt}
                                {opt !== 0 && suffix && <span className="text-xs ml-1 opacity-70 font-normal">{suffix}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </>
  );
}
