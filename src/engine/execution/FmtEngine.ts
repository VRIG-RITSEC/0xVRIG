import { Exercise } from '@/exercises/types';
import { StackSim } from '@/engine/simulators/StackSim';
import { hex8 } from '@/engine/helpers';

export interface FmtResult {
  logs: Array<{ cls: string; msg: string }>;
  fmtLeakedSecret: boolean;
  fmtWriteSuccess: boolean;
  win?: { title: string; msg: string };
}

function buildReadStack(ex: Exercise, sim: StackSim): Array<{ label: string; value: number }> {
  const retAddr = sim.origRetAddr;
  const secretSlot = ex.secretOffset ?? 3;
  const base: Array<{ label: string; value: number }> = [
    { label: 'printf internal', value: 0xbfff0200 },
    { label: 'buf pointer', value: sim.baseAddr },
    { label: 'saved register (ecx)', value: 0x00000040 },
    { label: 'saved register (edx)', value: 0x00000001 },
    { label: 'argc', value: 0x00000001 },
    { label: 'argv pointer', value: 0xbfff0400 },
    { label: 'envp pointer', value: 0xbfff0408 },
    { label: 'saved EBP', value: 0xbfff0300 },
    { label: 'return address', value: retAddr },
    { label: 'stack frame padding', value: 0x00000000 },
    { label: 'libc __start_main', value: 0xf7de1b00 },
    { label: 'stack cookie residual', value: 0x00000000 },
  ];

  // Place secret at the configured offset
  if (secretSlot < base.length) {
    base[secretSlot] = { label: '\u2605 secret', value: ex.secretValue ?? 0 };
  }

  return base;
}

export function simulateFmtRead(
  input: string,
  ex: Exercise,
  sim: StackSim,
  symbols: Record<string, number>,
): FmtResult {
  const result: FmtResult = { logs: [], fmtLeakedSecret: false, fmtWriteSuccess: false };

  result.logs.push({ cls: 'info', msg: '\u2550\u2550\u2550 ' + ex.title + ' \u2550\u2550\u2550' });
  result.logs.push({ cls: 'action', msg: 'printf(buf) \u2014 interpreting your input as a format string...' });
  result.logs.push({ cls: 'info', msg: '' });

  const stackValues = buildReadStack(ex, sim);

  let output = '';
  let stackIdx = 0;
  let i = 0;

  while (i < input.length) {
    if (input[i] === '%' && i + 1 < input.length) {
      // Direct parameter: %N$x, %N$p, %N$n
      const directMatch = input.slice(i).match(/^%(\d+)\$([xpns])/);
      if (directMatch) {
        const slotNum = parseInt(directMatch[1]);
        const action = directMatch[2];
        if ((action === 'x' || action === 'p') && slotNum <= stackValues.length) {
          const sv = stackValues[slotNum - 1];
          const hexVal = (sv.value >>> 0).toString(16).padStart(8, '0');
          const prefix = action === 'p' ? '0x' : '';
          output += prefix + hexVal;
          result.logs.push({ cls: 'action', msg: '%' + slotNum + '$' + action + ' \u2192 read slot ' + slotNum + ': <span class="log-addr">0x' + hexVal + '</span> <span class="log-label">(' + sv.label + ')</span>' });
          if (sv.value === ex.secretValue) {
            result.logs.push({ cls: 'success', msg: '\u2605 That\'s the secret! You found it: 0x' + hexVal.toUpperCase() });
            result.fmtLeakedSecret = true;
          }
        } else if (action === 'n') {
          result.logs.push({ cls: 'error', msg: '%' + slotNum + '$n \u2192 this WRITES to memory! Dangerous, but we\'ll learn about it next.' });
        }
        i += directMatch[0].length;
        continue;
      }

      // Width specifier: %Nx or %Nc
      const widthMatch = input.slice(i).match(/^%(\d+)([xc])/);
      if (widthMatch) {
        const width = parseInt(widthMatch[1]);
        const action = widthMatch[2];
        if (action === 'x' && stackIdx < stackValues.length) {
          const sv = stackValues[stackIdx];
          const hexVal = (sv.value >>> 0).toString(16).padStart(Math.max(8, width), '0');
          output += hexVal;
          result.logs.push({ cls: 'action', msg: '%' + width + 'x \u2192 read slot ' + (stackIdx + 1) + ' (padded to ' + width + ' chars): <span class="log-addr">0x' + hexVal.slice(-8) + '</span> <span class="log-label">(' + sv.label + ')</span>' });
          if (sv.value === ex.secretValue) {
            result.fmtLeakedSecret = true;
          }
          stackIdx++;
        } else if (action === 'c') {
          const padding = ' '.repeat(width);
          output += padding;
          result.logs.push({ cls: 'action', msg: '%' + width + 'c \u2192 output ' + width + ' characters of padding' });
        }
        i += widthMatch[0].length;
        continue;
      }

      const spec = input[i + 1];
      if ((spec === 'x' || spec === 'p') && stackIdx < stackValues.length) {
        const sv = stackValues[stackIdx];
        const hexVal = (sv.value >>> 0).toString(16).padStart(8, '0');
        const prefix = spec === 'p' ? '0x' : '';
        output += prefix + hexVal;
        result.logs.push({ cls: 'action', msg: '%' + spec + ' \u2192 read stack slot ' + (stackIdx + 1) + ': <span class="log-addr">0x' + hexVal + '</span> <span class="log-label">(' + sv.label + ')</span>' });

        if (sv.value === ex.secretValue) {
          result.logs.push({ cls: 'success', msg: '\u2605 That\'s the secret! You found it: 0x' + hexVal.toUpperCase() });
          result.fmtLeakedSecret = true;
        }
        stackIdx++;
        i += 2;
        continue;
      } else if (spec === 's') {
        output += '(string)';
        result.logs.push({ cls: 'warn', msg: '%s \u2192 tried to read a string from the stack \u2014 could crash the program!' });
        stackIdx++;
        i += 2;
        continue;
      } else if (spec === 'n') {
        result.logs.push({ cls: 'error', msg: '%n \u2192 this WRITES to memory! Dangerous, but we\'ll learn about it next.' });
        stackIdx++;
        i += 2;
        continue;
      }
    }
    output += input[i];
    i++;
  }

  result.logs.push({ cls: 'info', msg: '' });
  result.logs.push({ cls: 'action', msg: 'printf output: "' + output + '"' });

  if (result.fmtLeakedSecret) {
    result.logs.push({ cls: 'info', msg: '' });
    result.logs.push({ cls: 'success', msg: 'The secret was at stack slot ' + ((ex.secretOffset ?? 3) + 1) + '. Tip: in real exploits you can use %' + ((ex.secretOffset ?? 3) + 1) + '$x to read a specific slot directly.' });
    result.win = { title: ex.winTitle, msg: ex.winMsg };
  } else if (stackIdx > 0) {
    result.logs.push({ cls: 'info', msg: '' });
    result.logs.push({ cls: 'info', msg: 'Keep adding more %x to walk further up the stack. The secret is hiding in one of the slots!' });
  }

  return result;
}

export function simulateFmtWrite(
  rawInput: string,
  ex: Exercise,
  sim: StackSim,
): FmtResult {
  const result: FmtResult = { logs: [], fmtLeakedSecret: false, fmtWriteSuccess: false };
  const targetAddr = ex.targetAddr ?? 0;

  const input = rawInput.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  result.logs.push({ cls: 'info', msg: '\u2550\u2550\u2550 ' + ex.title + ' \u2550\u2550\u2550' });
  result.logs.push({ cls: 'info', msg: 'authorized is at <span class="log-addr">' + hex8(targetAddr) + '</span> \u2014 currently 0' });
  result.logs.push({ cls: 'action', msg: 'printf(buf) \u2014 your input is the format string...' });
  result.logs.push({ cls: 'info', msg: '' });

  const bufBytes: number[] = [];
  for (let j = 0; j < Math.min(4, input.length); j++) bufBytes.push(input.charCodeAt(j) & 0xff);
  const addrFromBuf = bufBytes.length >= 4 ? (bufBytes[0] | (bufBytes[1] << 8) | (bufBytes[2] << 16) | (bufBytes[3] << 24)) >>> 0 : 0;

  const stackSlots = [
    { label: 'printf internal', value: 0xbfff0200 },
    { label: 'buf pointer', value: sim.baseAddr },
    { label: 'saved register', value: 0x00000040 },
    { label: 'buf[0..3] \u2014 YOUR address bytes', value: addrFromBuf },
  ];

  // Track byte-level writes to memory for %hhn/%hn support
  const memoryWrites: Map<number, number> = new Map();

  let printedChars = 4;
  let stackIdx = 0;
  let i = 4;

  if (bufBytes.length >= 4) {
    result.logs.push({ cls: 'info', msg: 'First 4 bytes \u2192 address: <span class="log-addr">' + hex8(addrFromBuf) + '</span>' + (addrFromBuf === targetAddr ? ' <span style="color:var(--green)">\u2713 matches authorized!</span>' : '') });
  }

  while (i < input.length) {
    // Direct parameter: %N$n, %N$hn, %N$hhn, %N$x, %N$p
    const directMatch = input.slice(i).match(/^%(\d+)\$(hhn|hn|n|x|p)/);
    if (directMatch) {
      const slotNum = parseInt(directMatch[1]);
      const action = directMatch[2];

      if ((action === 'x' || action === 'p') && slotNum <= stackSlots.length) {
        const sv = stackSlots[slotNum - 1];
        const hexVal = (sv.value >>> 0).toString(16).padStart(8, '0');
        printedChars += hexVal.length;
        result.logs.push({ cls: 'action', msg: '%' + slotNum + '$' + action + ' \u2192 read slot ' + slotNum + ': <span class="log-addr">0x' + hexVal + '</span> <span class="log-label">(' + sv.label + ')</span>' });
      } else if ((action === 'n' || action === 'hn' || action === 'hhn') && slotNum <= stackSlots.length) {
        const sv = stackSlots[slotNum - 1];
        let writeVal = printedChars;
        let writeSize = 4;
        let sizeLabel = '4 bytes';

        if (action === 'hn') {
          writeVal = printedChars & 0xFFFF;
          writeSize = 2;
          sizeLabel = '2 bytes (half-word)';
        } else if (action === 'hhn') {
          writeVal = printedChars & 0xFF;
          writeSize = 1;
          sizeLabel = '1 byte';
        }

        result.logs.push({ cls: 'action', msg: '%' + slotNum + '$' + action + ' \u2192 WRITE ' + writeVal + ' (' + sizeLabel + ') to address at slot ' + slotNum + ': <span class="log-addr">' + hex8(sv.value) + '</span>' });

        // Record the write
        for (let b = 0; b < writeSize; b++) {
          memoryWrites.set(sv.value + b, (writeVal >>> (b * 8)) & 0xFF);
        }

        if (sv.value === targetAddr) {
          result.logs.push({ cls: 'success', msg: 'Wrote ' + writeVal + ' to authorized! It\'s now non-zero \u2192 win() is called!' });
          result.fmtWriteSuccess = true;
        } else {
          result.logs.push({ cls: 'warn', msg: 'Wrote to ' + hex8(sv.value) + ' \u2014 that\'s not authorized (' + hex8(targetAddr) + ')' });
        }
      }
      i += directMatch[0].length;
      continue;
    }

    // Width + format: %Nc, %Nx
    const widthMatch = input.slice(i).match(/^%(\d+)([cxp])/);
    if (widthMatch) {
      const width = parseInt(widthMatch[1]);
      const action = widthMatch[2];
      if (action === 'c') {
        printedChars += width;
        result.logs.push({ cls: 'action', msg: '%' + width + 'c \u2192 output ' + width + ' characters of padding (total printed: ' + printedChars + ')' });
      } else if ((action === 'x' || action === 'p') && stackIdx < stackSlots.length) {
        const sv = stackSlots[stackIdx];
        const hexVal = (sv.value >>> 0).toString(16).padStart(Math.max(8, width), '0');
        printedChars += Math.max(8, width);
        result.logs.push({ cls: 'action', msg: '%' + width + action + ' \u2192 read slot ' + (stackIdx + 1) + ' (padded to ' + width + ' chars)' });
        stackIdx++;
      }
      i += widthMatch[0].length;
      continue;
    }

    if (input[i] === '%' && i + 1 < input.length) {
      // %hhn, %hn (sequential)
      const seqWriteMatch = input.slice(i).match(/^%(hhn|hn|n)/);
      if (seqWriteMatch && stackIdx < stackSlots.length) {
        const action = seqWriteMatch[1];
        const sv = stackSlots[stackIdx];
        let writeVal = printedChars;
        let writeSize = 4;
        let sizeLabel = '4 bytes';

        if (action === 'hn') {
          writeVal = printedChars & 0xFFFF;
          writeSize = 2;
          sizeLabel = '2 bytes (half-word)';
        } else if (action === 'hhn') {
          writeVal = printedChars & 0xFF;
          writeSize = 1;
          sizeLabel = '1 byte';
        }

        result.logs.push({ cls: 'action', msg: '%' + action + ' \u2192 WRITE ' + writeVal + ' (' + sizeLabel + ') to address at slot ' + (stackIdx + 1) + ': <span class="log-addr">' + hex8(sv.value) + '</span>' });

        for (let b = 0; b < writeSize; b++) {
          memoryWrites.set(sv.value + b, (writeVal >>> (b * 8)) & 0xFF);
        }

        if (sv.value === targetAddr) {
          result.logs.push({ cls: 'success', msg: 'Wrote ' + writeVal + ' to authorized! It\'s now non-zero \u2192 win() is called!' });
          result.fmtWriteSuccess = true;
        } else {
          result.logs.push({ cls: 'warn', msg: 'Wrote to ' + hex8(sv.value) + ' \u2014 not authorized. Use %x to advance to slot 4 first.' });
        }
        stackIdx++;
        i += seqWriteMatch[0].length + 1; // +1 for the %
        continue;
      }

      const spec = input[i + 1];
      if ((spec === 'x' || spec === 'p') && stackIdx < stackSlots.length) {
        const sv = stackSlots[stackIdx];
        const hexVal = (sv.value >>> 0).toString(16).padStart(8, '0');
        printedChars += hexVal.length;
        result.logs.push({ cls: 'action', msg: '%' + spec + ' \u2192 read slot ' + (stackIdx + 1) + ': <span class="log-addr">0x' + hexVal + '</span> <span class="log-label">(' + sv.label + ')</span>' });
        stackIdx++;
        i += 2;
        continue;
      } else if (spec === 'n') {
        if (stackIdx < stackSlots.length) {
          const sv = stackSlots[stackIdx];
          result.logs.push({ cls: 'action', msg: '%n \u2192 WRITE value ' + printedChars + ' to address at slot ' + (stackIdx + 1) + ': <span class="log-addr">' + hex8(sv.value) + '</span>' });
          if (sv.value === targetAddr) {
            result.logs.push({ cls: 'success', msg: 'Wrote ' + printedChars + ' to authorized! It\'s now non-zero \u2192 win() is called!' });
            result.fmtWriteSuccess = true;
          } else {
            result.logs.push({ cls: 'warn', msg: 'Wrote to ' + hex8(sv.value) + ' \u2014 not authorized. Use %x to advance to slot 4 first.' });
          }
          stackIdx++;
        }
        i += 2;
        continue;
      }
    }
    printedChars++;
    i++;
  }

  result.logs.push({ cls: 'info', msg: '' });
  if (result.fmtWriteSuccess) {
    result.win = { title: ex.winTitle, msg: ex.winMsg };
  } else if (addrFromBuf !== targetAddr) {
    result.logs.push({ cls: 'info', msg: 'Hint: start your input with the address of authorized (' + hex8(targetAddr) + ') as \\x bytes in little-endian order.' });
  } else {
    result.logs.push({ cls: 'info', msg: 'Address is correct! Use %x to advance past slots 1-3, then %n to write. Or try %4$n for direct access.' });
  }

  return result;
}
