'use client';

import { useState } from 'react';
import { Exercise } from '@/exercises/types';
import SymbolTable from './tools/SymbolTable';
import HexCalculator from './tools/HexCalculator';
import PayloadBuilder from './tools/PayloadBuilder';
import GadgetTable from './tools/GadgetTable';
import SigframeBuilder from './tools/SigframeBuilder';

interface ToolSection {
  id: string;
  label: string;
  visible: boolean;
  component: React.ReactNode;
}

export default function Toolkit({ exercise }: { exercise: Exercise }) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections: ToolSection[] = [
    { id: 'symbols', label: 'SYMBOLS', visible: !!exercise.showSymbols, component: <SymbolTable /> },
    { id: 'calc', label: 'HEX CALC', visible: !!exercise.showCalc, component: <HexCalculator /> },
    { id: 'builder', label: 'PAYLOAD', visible: !!exercise.showBuilder, component: <PayloadBuilder /> },
    { id: 'gadgets', label: 'GADGETS', visible: !!exercise.showGadgetTable, component: <GadgetTable /> },
    { id: 'sigframe', label: 'SIGFRAME', visible: !!exercise.showSigframe, component: <SigframeBuilder /> },
  ];

  const visibleSections = sections.filter((s) => s.visible);
  if (visibleSections.length === 0) return null;

  return (
    <div className="toolkit">
      {visibleSections.map((section) => {
        const isOpen = openSection === section.id;
        return (
          <div key={section.id} className="toolkit-section">
            <button
              className="toolkit-header"
              onClick={() => setOpenSection(isOpen ? null : section.id)}
            >
              <span className="sidebar-chevron">{isOpen ? '\u25BE' : '\u25B8'}</span>
              {section.label}
            </button>
            {isOpen && <div className="toolkit-body">{section.component}</div>}
          </div>
        );
      })}
    </div>
  );
}
