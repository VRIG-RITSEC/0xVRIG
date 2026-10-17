import { addrToLE } from '@/engine/helpers';
import { StackSim } from '@/engine/simulators/StackSim';

export const DEMO_IDS = ['overflow', 'addresses', 'counter'] as const;
export type DemoId = typeof DEMO_IDS[number];

export const DEMO_CHALLENGES = {
  overflow: {
    label: 'Buffer overflow',
    title: 'Can you become admin?',
    description: 'A program sets aside 16 bytes for your name, but forgets to check how much you type. Extra letters spill into nearby memory. That bug is called a buffer overflow.',
    mission: 'Try your name, then keep typing until the program crashes. Can you turn that crash into admin access by changing where it goes next?',
    takeaway: 'You used a buffer overflow to make the program call its admin function. The shape of your input changed where it went next.',
    workshop: '/imagine-rit/rit-02',
  },
  addresses: {
    label: 'An address leak',
    title: 'Same trick. A different address.',
    description: 'The admin function has moved. A forgotten debug message gives away its new address. Can you use it?',
    mission: 'The shape of your input stays the same: 20 bytes of name, then a 4-byte destination. Match that destination to the leaked address.',
    takeaway: 'Moving functions makes an old exploit fail. An address leak reveals where to aim again. This is the idea behind bypassing address randomization (ASLR).',
    workshop: '/imagine-rit/rit-04',
  },
  counter: {
    label: 'Integer overflow',
    title: 'A big number. A tiny buffer.',
    description: 'This toy program uses a counter that only holds 0–255. Make its size calculation wrap around.',
    mission: 'Choose a large input. If its size wraps around, the program will reserve too little memory and copy more data than fits.',
    takeaway: 'The size calculation wrapped around, so the program reserved less memory than it needed. This is how an integer overflow can lead to a buffer overflow.',
    workshop: '/exercise/logic-06',
  },
} satisfies Record<DemoId, { label: string; title: string; description: string; mission: string; takeaway: string; workshop: string }>;

export const MAX_PAYLOAD_TEXT_BYTES = 64;

export function textBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

export function limitPayloadText(text: string, limit = MAX_PAYLOAD_TEXT_BYTES): string {
  let result = '';
  let length = 0;
  for (const character of text) {
    length += textBytes(character).length;
    if (length > limit) break;
    result += character;
  }
  return result;
}

export interface DemoInput {
  text: string;
  ending: number | null;
  requested: number;
}

export interface DemoDraft extends DemoInput {
  crashed: boolean;
  lastRun: DemoInput | null;
}

export function isDemoId(value: unknown): value is DemoId {
  return typeof value === 'string' && DEMO_IDS.some(id => id === value);
}

export function initialDraft(id: DemoId): DemoDraft {
  return { text: id === 'addresses' ? 'A'.repeat(20) : '', ending: null, requested: 8, crashed: false, lastRun: null };
}

export function inputOf(input: DemoInput): DemoInput {
  return { text: input.text, ending: input.ending, requested: input.requested };
}

export function sameInput(a: DemoInput, b: DemoInput): boolean {
  return a.text === b.text && a.ending === b.ending && a.requested === b.requested;
}

export function symbolsFor(id: DemoId, offset: number) {
  const shift = id === 'addresses' ? offset : 0;
  return { normal: 0x08048025 + shift, admin: 0x08048150 + shift };
}

export function payloadFor(input: DemoInput): number[] {
  const bytes = textBytes(input.text);
  return input.ending === null ? bytes : [...bytes, ...addrToLE(input.ending.toString(16))!];
}

export function withDestination(input: DemoInput, address: number): DemoInput {
  const clipped = limitPayloadText(input.text, 20);
  // A Unicode character can cross byte 20. Preserve complete characters and fill
  // that partial character's space so the destination still lands at byte 20.
  const text = textBytes(input.text).length >= 20
    ? clipped + 'A'.repeat(20 - textBytes(clipped).length)
    : input.text;
  return { ...inputOf(input), text, ending: address };
}

export function evaluateStack(id: DemoId, input: DemoInput, offset: number) {
  const symbols = symbolsFor(id, offset);
  // A fresh snapshot keeps bytes from an earlier, longer attempt out of the next one.
  const payload = payloadFor(input);
  const sim = new StackSim({ bufSize: 16, retAddr: symbols.normal, savedEbp: 0xbfff0200, extraSize: Math.max(0, payload.length - 24) });
  sim.writeInput(payload);
  const destination = sim.getRetAddr();
  const outcome = destination === symbols.admin ? 'success' : destination === symbols.normal ? 'normal' : 'crash';
  return { sim, payload, destination, outcome, symbols };
}

export function evaluateCounter(requested: number) {
  const overhead = 8;
  const mathematicalSize = requested + overhead;
  const allocated = mathematicalSize & 0xff;
  const wrapped = mathematicalSize > 255;
  return { requested, overhead, mathematicalSize, allocated, wrapped, success: wrapped && allocated < requested };
}

export function didSucceed(id: DemoId, input: DemoInput, offset: number): boolean {
  return id === 'counter' ? evaluateCounter(input.requested).success : evaluateStack(id, input, offset).outcome === 'success';
}

export function newAddressOffset(): number {
  return (1 + Math.floor(Math.random() * 511)) * 0x1000;
}
