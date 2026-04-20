import { describe, it, expect } from 'vitest';
import { UNITS, TRACKS, BADGES, getExercise, getAllExercises } from '../registry';

describe('Exercise Registry', () => {
  const allExercises = getAllExercises();
  const allIds = new Set(allExercises.map(ex => ex.id));

  describe('exercise integrity', () => {
    it('has exercises', () => {
      expect(allExercises.length).toBeGreaterThan(50);
    });

    it('all exercises have unique IDs', () => {
      expect(allIds.size).toBe(allExercises.length);
    });

    it('all exercises have required fields', () => {
      for (const ex of allExercises) {
        expect(ex.id, `exercise missing id`).toBeTruthy();
        expect(ex.unitId, `${ex.id} missing unitId`).toBeTruthy();
        expect(ex.title, `${ex.id} missing title`).toBeTruthy();
        expect(ex.mode, `${ex.id} missing mode`).toBeTruthy();
        expect(ex.vizMode, `${ex.id} missing vizMode`).toBeTruthy();
        expect(typeof ex.check, `${ex.id} missing check function`).toBe('function');
        expect(ex.winTitle, `${ex.id} missing winTitle`).toBeTruthy();
        expect(ex.winMsg, `${ex.id} missing winMsg`).toBeTruthy();
      }
    });

    it('getExercise returns correct exercise', () => {
      const first = allExercises[0];
      expect(getExercise(first.id)).toBe(first);
    });

    it('getExercise returns undefined for unknown ID', () => {
      expect(getExercise('nonexistent-99')).toBeUndefined();
    });
  });

  describe('unit integrity', () => {
    it('has units', () => {
      expect(UNITS.length).toBeGreaterThan(10);
    });

    it('all unit exerciseIds reference existing exercises', () => {
      for (const unit of UNITS) {
        for (const exId of unit.exerciseIds) {
          expect(allIds.has(exId), `Unit "${unit.id}" references non-existent exercise "${exId}"`).toBe(true);
        }
      }
    });

    it('all exercises belong to a unit', () => {
      const unitExIds = new Set(UNITS.flatMap(u => u.exerciseIds));
      for (const ex of allExercises) {
        expect(unitExIds.has(ex.id), `Exercise "${ex.id}" not in any unit`).toBe(true);
      }
    });

    it('exercise unitId matches the unit it appears in', () => {
      for (const unit of UNITS) {
        for (const exId of unit.exerciseIds) {
          const ex = getExercise(exId);
          if (ex) {
            expect(ex.unitId, `Exercise "${exId}" has unitId "${ex.unitId}" but is in unit "${unit.id}"`).toBe(unit.id);
          }
        }
      }
    });

    it('no exercise appears in multiple units', () => {
      const seen = new Map<string, string>();
      for (const unit of UNITS) {
        for (const exId of unit.exerciseIds) {
          if (seen.has(exId)) {
            throw new Error(`Exercise "${exId}" in both "${seen.get(exId)}" and "${unit.id}"`);
          }
          seen.set(exId, unit.id);
        }
      }
    });
  });

  describe('track integrity', () => {
    it('all track unitIds reference existing units', () => {
      const unitIds = new Set(UNITS.map(u => u.id));
      for (const track of TRACKS) {
        for (const unitId of track.unitIds) {
          expect(unitIds.has(unitId), `Track "${track.id}" references non-existent unit "${unitId}"`).toBe(true);
        }
      }
    });

    it('all units belong to a track', () => {
      const trackUnitIds = new Set(TRACKS.flatMap(t => t.unitIds));
      for (const unit of UNITS) {
        expect(trackUnitIds.has(unit.id), `Unit "${unit.id}" not in any track`).toBe(true);
      }
    });
  });

  describe('badge integrity', () => {
    it('badges have required fields', () => {
      for (const badge of BADGES) {
        expect(badge.id).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.icon).toBeTruthy();
        expect(typeof badge.condition).toBe('function');
      }
    });

    it('badges are not achievable with empty completion set', () => {
      const empty = new Set<string>();
      for (const badge of BADGES) {
        expect(badge.condition(empty), `Badge "${badge.id}" should not be earned with no completions`).toBe(false);
      }
    });

    it('certified-hacker badge requires all exercises', () => {
      const allCompleted = new Set(allExercises.map(ex => ex.id));
      const certHacker = BADGES.find(b => b.id === 'certified-hacker');
      expect(certHacker).toBeDefined();
      expect(certHacker!.condition(allCompleted)).toBe(true);
    });

    it('certified-hacker badge fails with one missing', () => {
      const almostAll = new Set(allExercises.map(ex => ex.id));
      almostAll.delete(allExercises[0].id);
      const certHacker = BADGES.find(b => b.id === 'certified-hacker');
      expect(certHacker!.condition(almostAll)).toBe(false);
    });
  });
});
