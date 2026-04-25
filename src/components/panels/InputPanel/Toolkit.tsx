'use client';

import { useEffect, useState } from 'react';
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

export default function Toolkit(
  { exercise, variant = 'tabs' }: { exercise: Exercise; variant?: 'tabs' | 'stack' },
) {
  const sections: ToolSection[] = [
    { id: 'symbols', label: 'SYMBOLS', visible: !!exercise.showSymbols, component: <SymbolTable /> },
    { id: 'calc', label: 'HEX CALC', visible: !!exercise.showCalc, component: <HexCalculator /> },
    { id: 'builder', label: 'PAYLOAD', visible: !!exercise.showBuilder, component: <PayloadBuilder /> },
    { id: 'gadgets', label: 'GADGETS', visible: !!exercise.showGadgetTable, component: <GadgetTable /> },
    { id: 'sigframe', label: 'SIGFRAME', visible: !!exercise.showSigframe, component: <SigframeBuilder /> },
  ];

  const visibleSections = sections.filter((s) => s.visible);
  const [activeSection, setActiveSection] = useState<string | null>(visibleSections[0]?.id ?? null);

  useEffect(() => {
    if (!visibleSections.length) {
      setActiveSection(null);
      return;
    }

    if (!activeSection || !visibleSections.some((section) => section.id === activeSection)) {
      setActiveSection(visibleSections[0].id);
    }
  }, [activeSection, visibleSections]);

  if (visibleSections.length === 0) return null;

  if (variant === 'stack') {
    return (
      <div className="toolkit toolkit-stack">
        {visibleSections.map((section) => (
          <section key={section.id} className="toolkit-stack-section">
            <div className="toolkit-stack-title">{section.label}</div>
            <div className="toolkit-stack-body">{section.component}</div>
          </section>
        ))}
      </div>
    );
  }

  const selectedSection = visibleSections.find((section) => section.id === activeSection) ?? visibleSections[0];

  return (
    <div className="toolkit">
      <div className="toolkit-tabs" role="tablist" aria-label="Exercise tools">
        {visibleSections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={selectedSection.id === section.id}
            className={`toolkit-tab${selectedSection.id === section.id ? ' active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className="toolkit-panel" role="tabpanel">
        {selectedSection.component}
      </div>
    </div>
  );
}
