/**
 * Searchable University/Institute combobox for the signup form.
 * As the user types, the dropdown filters and sorts matching universities.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ChevronDown, Check, Search } from 'lucide-react';
import { INDIAN_UNIVERSITIES } from '@/data/universities';

interface UniversityComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export default function UniversityCombobox({ value, onChange }: UniversityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter and sort universities based on search
  const filteredUniversities = INDIAN_UNIVERSITIES
    .filter((uni) => uni.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const searchLower = search.toLowerCase();

      // Prioritize universities that start with the search term
      const aStarts = aLower.startsWith(searchLower);
      const bStarts = bLower.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Then by index of match (earlier match = higher priority)
      const aIndex = aLower.indexOf(searchLower);
      const bIndex = bLower.indexOf(searchLower);
      if (aIndex !== bIndex) return aIndex - bIndex;

      // Alphabetical fallback
      return aLower.localeCompare(bLower);
    });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (uni: string) => {
    onChange(uni);
    setSearch('');
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className={`w-full flex items-center pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-left transition-all outline-none ${
          isOpen
            ? 'border-[#F5B800] ring-2 ring-[#F5B800]/30'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <span className={value ? 'text-gray-900 text-sm truncate flex-1' : 'text-gray-400 text-sm flex-1'}>
          {value || 'Select your university or institute'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search university..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#F5B800] focus:ring-1 focus:ring-[#F5B800]/30"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto">
              {filteredUniversities.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No universities found matching "{search}"
                </div>
              ) : (
                filteredUniversities.slice(0, 50).map((uni) => (
                  <button
                    key={uni}
                    type="button"
                    onClick={() => handleSelect(uni)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[#F5B800]/10 ${
                      value === uni ? 'bg-[#F5B800]/5 text-[#F5B800] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {value === uni && <Check className="w-4 h-4 text-[#F5B800] flex-shrink-0" />}
                    <span className={value === uni ? '' : 'pl-6'}>{uni}</span>
                  </button>
                ))
              )}
              {filteredUniversities.length > 50 && (
                <div className="px-4 py-2 text-xs text-gray-400 text-center border-t">
                  Type to narrow down ({filteredUniversities.length} results)
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
