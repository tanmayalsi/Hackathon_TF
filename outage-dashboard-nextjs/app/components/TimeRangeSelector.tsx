'use client';

import { motion } from 'framer-motion';
import type { TimeRangeOption } from '@/types';

interface TimeRangeSelectorProps {
  selectedHours: number;
  onSelect: (hours: number) => void;
  ranges?: TimeRangeOption[];
}

const DEFAULT_TIME_RANGES: TimeRangeOption[] = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Last 6 Hours', hours: 6 },
  { label: 'Last 24 Hours', hours: 24 },
  { label: 'Last Week', hours: 168 },
  { label: 'Last Month', hours: 720 },
];

export function TimeRangeSelector({ selectedHours, onSelect, ranges }: TimeRangeSelectorProps) {
  const TIME_RANGES = ranges || DEFAULT_TIME_RANGES;
  return (
    <div className="flex flex-wrap gap-2">
      {TIME_RANGES.map((range) => {
        const isSelected = selectedHours === range.hours;
        return (
          <motion.button
            key={range.hours}
            onClick={() => onSelect(range.hours)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-4 py-2 rounded font-medium transition-colors border-2 border-black
              ${
                isSelected
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }
            `}
          >
            {range.label}
          </motion.button>
        );
      })}
    </div>
  );
}
