'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  size = 'md',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border transition-all text-left cursor-pointer ${
          size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'
        } ${
          open
            ? 'bg-white border-[#0284c7] ring-2 ring-[#0284c7]/15 text-slate-900'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="font-semibold truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180 text-[#0284c7]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 py-1.5 max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  size === 'sm' ? 'text-xs' : 'text-sm'
                } ${
                  isSelected
                    ? 'bg-sky-50/90 text-[#0284c7] font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.subLabel && (
                      <div className="text-[10px] text-slate-400 font-normal truncate">
                        {opt.subLabel}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#0284c7] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

