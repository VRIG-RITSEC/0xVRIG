import { Exercise, CodeLine } from '@/exercises/types';
import { StackSim } from '@/engine/simulators/StackSim';
import { hex8, hex2, toAscii } from '@/engine/helpers';

export interface ExecStep {
  label: string;
  srcLine: number;
  logs: Array<[string, string]>;
  action: (sim: StackSim) => void;
  canaryCheck?: boolean;
  retCheck?: boolean;
  jumpCheck?: boolean;
  oboRetCheck?: boolean;
  ret2libcCheck?: boolean;
  ropChainExec?: boolean;
  sropExec?: boolean;
}

export function findCodeLine(code: CodeLine[], pattern: string): number {
  return code.findIndex(l => l.text.includes(pattern));
}

export function findVulnClose(code: CodeLine[]): number {
  const fnLine = code.find(l => l.fn);
  const fnName = fnLine ? (fnLine.text.match(/void\s+(\w+)/)||[])[1] || 'vuln' : 'vuln';
  const start = findCodeLine(code, 'void ' + fnName);
  if (start < 0) return -1;
  for (let i = start + 1; i < code.length; i++) {
    if (code[i].text.trim() === '}') return i;
  }
  return -1;
}

export function generateExecSteps(
  ex: Exercise,
  bytes: number[],
  sim: StackSim,
  symbols: Record<string, number>,
  extraState?: { intOverflowLen?: number; signedLen?: number },
): ExecStep[] {
  const code = ex.source.c;
  const steps: ExecStep[] = [];
  const WORD = 4;

  // Integer overflow preamble steps
  if (ex.intOverflow) {
    const userLen = extraState?.intOverflowLen ?? bytes.length;
    const headerSize = ex.headerSize ?? 64;
    const total = (userLen + headerSize) >>> 0;

    steps.push({
      label: 'scanf \u2014 read user length',
      srcLine: findCodeLine(code, 'scanf'),
      logs: [['action', 'scanf("%u", &len) \u2192 user entered: ' + userLen]],
      action() {}
    });
    steps.push({
      label: 'compute total = len + ' + headerSize,
      srcLine: findCodeLine(code, 'total = user_len'),
      logs: [
        ['action', 'total = ' + userLen + ' + ' + headerSize + ' = ...'],
        ['error', '\u26A0 Integer overflow! Result wraps to ' + total + ' (0x' + total.toString(16).toUpperCase().padStart(8, '0') + ')'],
      ],
      action() {}
    });
  }

  // Signedness bug preamble steps
  if (ex.signedness) {
    const signedLen = extraState?.signedLen ?? -1;
    steps.push({
      label: 'scanf \u2014 read length',
      srcLine: findCodeLine(code, 'scanf'),
      logs: [['action', 'scanf("%d", &len) \u2192 user entered: ' + signedLen]],
      action() {}
    });
    steps.push({
      label: 'bounds check: len > 64?',
      srcLine: findCodeLine(code, 'if (len'),
      logs: [
        ['action', 'if (' + signedLen + ' > 64) \u2192 NO, check passes!'],
        ['warn', 'Negative numbers are always < 64 in signed comparison!'],
      ],
      action() {}
    });
    steps.push({
      label: 'cast to unsigned for memcpy',
      srcLine: findCodeLine(code, 'memcpy'),
      logs: [
        ['action', '(size_t)' + signedLen + ' \u2192 ' + (signedLen >>> 0)],
        ['error', 'memcpy will copy a HUGE number of bytes!'],
      ],
      action() {}
    });
  }

  // Detect function name for this exercise
  const fnLine = code.find(l => l.fn);
  const fnName = fnLine ? (fnLine.text.match(/void\s+(\w+)/)||[])[1] || 'vuln' : 'vuln';
  const callPattern = fnName === 'vuln' ? '    vuln();' : '    ' + fnName + '(';

  // 1. CALL function
  steps.push({
    label: 'CALL ' + fnName,
    srcLine: findCodeLine(code, callPattern),
    logs: [['action', '\u25B6 Calling ' + fnName + '() \u2014 saving go-back address <span class="log-addr">' + hex8(sim.origRetAddr) + '</span>']],
    action(s) {
      s.clearBlank();
      s._writeLE(s.bufSize + s.canarySize + 4, s.origRetAddr, 4);
      s.markRegion(s.bufSize + s.canarySize + 4, s.totalSize);
    }
  });

  // 2. push EBP
  steps.push({
    label: 'save bookmark (push EBP)',
    srcLine: findCodeLine(code, 'void ' + fnName),
    logs: [['action', 'Save bookmark to previous frame <span class="log-addr">' + hex8(sim.origSavedEbp) + '</span> (so the program can clean up later)']],
    action(s) {
      s._writeLE(s.bufSize + s.canarySize, s.origSavedEbp, 4);
      s.markRegion(s.bufSize + s.canarySize, s.bufSize + s.canarySize + 4);
    }
  });

  // 3. sub ESP (allocate buffer + canary)
  const allocLabel = sim.useCanary
    ? 'Make room for buf[' + sim.bufSize + '] + canary[4] (' + (sim.bufSize + sim.canarySize) + ' bytes)'
    : 'Make room for buf[' + sim.bufSize + '] (' + sim.bufSize + ' bytes on the stack)';
  steps.push({
    label: allocLabel,
    srcLine: findCodeLine(code, 'char buf'),
    logs: [['action', allocLabel]],
    action(s) {
      for (let i = 0; i < s.bufSize; i++) s.memory[i] = 0;
      if (s.useCanary) s._writeLE(s.bufSize, s.canaryValue, 4);
      s.markRegion(0, s.bufSize + s.canarySize);
    }
  });

  // 4. Info leak lines (printf)
  const leakLine = code.findIndex(l => l.text.includes('printf') && (l.text.includes('DEBUG') || l.text.includes('printf(buf)')));
  if (leakLine >= 0) {
    steps.push({
      label: 'printf \u2014 accidental leak!',
      srcLine: leakLine,
      logs: ex.aslr
        ? [['warn', 'printf output: DEBUG: main() is at <span class="log-addr">' + hex8(symbols.main) + '</span> <span class="log-label">\u2190 the program leaked an address!</span>']]
        : ex.canary
          ? [['warn', 'Bug in printf(buf) leaks the secret tripwire: canary = <span class="log-addr">' + hex8(sim.canaryValue) + '</span> <span class="log-label">\u2190 now we know it!</span>']]
          : [['info', 'printf output']],
      action() {}
    });
  }

  // 5. gets(buf) \u2014 write word by word
  let getsLine = findCodeLine(code, 'gets');
  if (getsLine < 0) getsLine = findCodeLine(code, 'read_input');
  if (getsLine < 0) getsLine = findCodeLine(code, 'read_byte');
  if (getsLine < 0) getsLine = findCodeLine(code, 'memcpy');
  const maxWrite = ex.offByOne ? Math.min(bytes.length, sim.bufSize + 1) : Math.min(bytes.length, sim.totalSize);
  const totalBytes = maxWrite;

  for (let off = 0; off < totalBytes; off += WORD) {
    const chunk = bytes.slice(off, Math.min(off + WORD, totalBytes));
    const region = sim.regionOf(off);
    const isOverflow = off >= sim.bufSize;
    let label = ex.offByOne ? 'read_byte(): write ' : ex.signedness ? 'memcpy(): write ' : 'gets(): write ';
    if (ex.offByOne && off === sim.bufSize) {
      label += 'OFF-BY-ONE \u2192 saved bookmark (low byte)';
    } else if (region === 'buffer') label += 'buf[' + off + '..' + (off + chunk.length - 1) + ']';
    else if (region === 'canary') label += 'OVERFLOW \u2192 canary (tripwire!)';
    else if (region === 'ebp') label += 'OVERFLOW \u2192 saved bookmark';
    else if (region === 'ret') label += 'OVERFLOW \u2192 go-back address!';

    const hexChunk = chunk.map(b => hex2(b)).join(' ');
    const asciiChunk = chunk.map(b => toAscii(b)).join('');

    const logs: Array<[string, string]> = [['action', label + '  [' + hexChunk + '] "' + asciiChunk + '"']];
    if (off === sim.bufSize && isOverflow) {
      logs.unshift(['warn', '\u26A0 OVERFLOW \u2014 input is spilling past the buffer! Everything above it is getting overwritten!']);
    }

    const capturedOff = off;
    const capturedChunk = chunk;
    steps.push({
      label,
      srcLine: getsLine,
      logs,
      action(s) { s.writeWord(capturedOff, capturedChunk); }
    });
  }

  // 6. gets returns
  steps.push({
    label: 'gets() returns',
    srcLine: getsLine,
    logs: [['action', 'gets() finished reading your input \u2014 ' + totalBytes + ' bytes placed on the stack.']],
    action(s) { s.clearHighlight(); }
  });

  // 7. Canary check (if applicable)
  if (sim.useCanary) {
    steps.push({
      label: 'Check the tripwire (canary)',
      srcLine: findVulnClose(code),
      logs: [],
      action(s) {
        s.markRegion(s.bufSize, s.bufSize + s.canarySize);
      },
      canaryCheck: true
    });
  }

  // 8. LEAVE
  steps.push({
    label: 'Clean up \u2014 function is ending',
    srcLine: findVulnClose(code),
    logs: [['action', 'Function is done \u2014 cleaning up the stack frame']],
    action(s) { s.markRegion(s.bufSize + s.canarySize, s.bufSize + s.canarySize + 4); }
  });

  // 9. RET \u2014 pop EIP
  steps.push({
    label: 'Return \u2014 jump to go-back address',
    srcLine: findVulnClose(code),
    logs: [],
    action(s) { s.markRegion(s.bufSize + s.canarySize + 4, s.totalSize); },
    retCheck: true
  });

  // 10. Jump destination
  if (!ex.offByOne && !ex.ret2libc && !ex.rop && !ex.srop) {
    steps.push({
      label: 'Jump! Where does the program go?',
      srcLine: -1,
      logs: [],
      action() {},
      jumpCheck: true
    });
  }

  // ret2libc check
  if (ex.ret2libc) {
    steps.push({
      label: 'ret2libc \u2014 calling system()?',
      srcLine: -1,
      logs: [],
      action() {},
      ret2libcCheck: true
    });
  }

  // ROP chain execution
  if (ex.rop) {
    steps.push({
      label: 'ROP chain \u2014 executing gadgets',
      srcLine: -1,
      logs: [],
      action() {},
      ropChainExec: true
    });
  }

  // SROP execution
  if (ex.srop) {
    steps.push({
      label: 'SROP \u2014 sigreturn restores registers',
      srcLine: -1,
      logs: [],
      action() {},
      sropExec: true
    });
  }

  // Off-by-one: after vuln's normal return, main's frame is corrupted
  if (ex.offByOne) {
    steps.push({
      label: 'vuln() returns normally',
      srcLine: -1,
      logs: [
        ['action', 'vuln() returned to main() \u2014 the return address wasn\'t touched, so that was normal.'],
      ],
      action() {}
    });
    steps.push({
      label: 'Back in main() \u2014 EBP is corrupted',
      srcLine: findCodeLine(code, 'return 0') >= 0 ? findCodeLine(code, 'return 0') : -1,
      logs: [
        ['action', 'Returned to main() \u2014 that looked normal...'],
        ['warn', 'But EBP is now corrupted! The low byte was overwritten by your 17th byte.'],
      ],
      action() {}
    });
    steps.push({
      label: 'main() returns \u2014 reads go-back addr from WRONG place',
      srcLine: -1,
      logs: [],
      action() {},
      oboRetCheck: true
    });
  }

  return steps;
}

export interface ExecStepResult {
  logs: Array<{ cls: string; msg: string }>;
  done: boolean;
  canaryFailed?: boolean;
  registerUpdates?: Record<string, number>;
  flagUpdates?: Record<string, boolean>;
  win?: { title: string; msg: string };
  highlightLine?: number;
}

export function execCurrentStep(
  step: ExecStep,
  sim: StackSim,
  ex: Exercise,
  symbols: Record<string, number>,
  state: { ropEax?: number; ropEbx?: number; ropFlagValue?: number },
): ExecStepResult {
  const result: ExecStepResult = { logs: [], done: false };
  const registerUpdates: Record<string, number> = {};

  // Execute the action
  step.action(sim);

  if (step.srcLine >= 0) {
    result.highlightLine = step.srcLine;
  }

  // Add step logs
  for (const [cls, msg] of step.logs) {
    result.logs.push({ cls, msg });
  }

  // Canary check
  if (step.canaryCheck) {
    if (!sim.canaryIntact()) {
      result.logs.push({ cls: 'error', msg: '*** stack smashing detected! *** The tripwire was <span class="log-addr">' + hex8(sim.canaryValue) + '</span> but is now <span class="log-addr">' + hex8(sim.getCanary()!) + '</span>' });
      result.logs.push({ cls: 'error', msg: 'Program aborted! You need to put the correct canary value at position ' + sim.bufSize + ' in your payload so the tripwire stays intact.' });
      result.canaryFailed = true;
      result.done = true;
      return result;
    } else {
      result.logs.push({ cls: 'success', msg: 'Tripwire (canary) intact \u2713 \u2014 snuck past it!' });
    }
  }

  // Ret check
  if (step.retCheck) {
    const retAddr = sim.getRetAddr();
    result.logs.push({ cls: 'action', msg: 'Reading the go-back address: <span class="log-addr">' + hex8(retAddr) + '</span> \u2014 the program will jump here!' });
  }

  // Off-by-one ret check
  if (step.oboRetCheck) {
    const lowByte = sim.memory[sim.bufSize];
    result.logs.push({ cls: 'action', msg: 'main() LEAVE \u2014 EBP low byte changed to 0x' + hex2(lowByte) });

    const readOffset = Math.min(lowByte % sim.bufSize, sim.bufSize - 4);
    const fakeRet = sim._readLE(readOffset, 4);

    result.logs.push({ cls: 'action', msg: 'main() reads go-back address from shifted location (buf+' + readOffset + ') \u2192 <span class="log-addr">' + hex8(fakeRet) + '</span>' });

    if (fakeRet === symbols.win) {
      result.logs.push({ cls: 'success', msg: '\u2192 Jumped to win() via off-by-one redirect!' });
      result.flagUpdates = { oboWin: true };
      result.win = { title: ex.winTitle, msg: ex.winMsg };
    } else if (fakeRet === 0 || fakeRet === sim.origRetAddr) {
      result.logs.push({ cls: 'info', msg: '\u2192 Normal return \u2014 your 17th byte didn\'t shift the frame usefully. Try a different value.' });
    } else {
      result.logs.push({ cls: 'error', msg: '\u2192 CRASH! Jumped to ' + hex8(fakeRet) + ' \u2014 not a valid address. Adjust the value at buf offset ' + readOffset + '.' });
    }
  }

  // Jump check
  if (step.jumpCheck) {
    const retAddr = sim.getRetAddr();
    const nxEnabled = !!ex.nx;
    const isStackAddr = retAddr >= 0xbfff0000 && retAddr < 0xc0000000;

    if (isStackAddr && nxEnabled) {
      result.logs.push({ cls: 'error', msg: '\u2192 CRASH: tried to run code at <span class="log-addr">' + hex8(retAddr) + '</span> but the stack is marked "no running code here" (NX)' });
      result.logs.push({ cls: 'error', msg: 'NX protection means the computer will store your data on the stack, but refuses to run it as code.' });
    } else if (isStackAddr && !nxEnabled) {
      result.logs.push({ cls: 'success', msg: '\u2192 Jumped to the stack at <span class="log-addr">' + hex8(retAddr) + '</span> \u2014 running your input as code!' });
    } else {
      const sym = Object.entries(symbols).find(([, a]) => a === retAddr);
      if (sym && sym[0] === 'win') {
        const winLine = findCodeLine(ex.source.c, 'void win');
        if (winLine >= 0) result.highlightLine = winLine;
        result.logs.push({ cls: 'success', msg: '\u2192 Jumped to win() \u2014 you control where the program goes!' });
        if (nxEnabled) result.logs.push({ cls: 'success', msg: 'NX bypassed \u2014 you jumped to a real function in the program instead of code on the stack. Smart!' });
        result.win = { title: ex.winTitle, msg: ex.winMsg };
      } else if (sym) {
        result.logs.push({ cls: 'info', msg: '\u2192 Jumped to ' + sym[0] + '() at ' + hex8(retAddr) });
      } else if (retAddr === sim.origRetAddr) {
        result.logs.push({ cls: 'info', msg: '\u2192 Normal return to main() at ' + hex8(retAddr) + ' \u2014 nothing was overwritten' });
      } else {
        result.logs.push({ cls: 'error', msg: '\u2192 CRASH! The program tried to jump to ' + hex8(retAddr) + ' which doesn\'t exist \u2014 Segmentation Fault' });
        // Check if crash was the goal (exercise 02)
        if (ex.check(sim, null, symbols, {})) {
          result.win = { title: ex.winTitle, msg: ex.winMsg };
        }
      }
    }
  }

  // ret2libc check
  if (step.ret2libcCheck) {
    const retAddr = sim.getRetAddr();
    const systemAddr = symbols.system;
    const binshAddr = symbols.binsh;

    result.logs.push({ cls: 'action', msg: 'Go-back address: <span class="log-addr">' + hex8(retAddr) + '</span>' });

    if (retAddr === systemAddr) {
      result.logs.push({ cls: 'success', msg: '\u2192 Jumping to system()!' });
      const fakeRetOffset = sim.bufSize + sim.canarySize + sim.ebpSize + sim.retSize;
      const argOffset = fakeRetOffset + 4;
      const fakeRet = sim._readLE(fakeRetOffset, 4);
      const arg = sim._readLE(argOffset, 4);
      result.logs.push({ cls: 'action', msg: 'system() reads its call frame from the stack:' });
      result.logs.push({ cls: 'action', msg: '  Fake return address: <span class="log-addr">' + hex8(fakeRet) + '</span> (don\'t care)' });
      result.logs.push({ cls: 'action', msg: '  Argument: <span class="log-addr">' + hex8(arg) + '</span>' + (arg === binshAddr ? ' \u2192 "/bin/sh"' : ' \u2192 not "/bin/sh"!') });

      if (arg === binshAddr) {
        result.logs.push({ cls: 'success', msg: '\u2192 system("/bin/sh") \u2014 shell spawned!' });
        result.win = { title: ex.winTitle, msg: ex.winMsg };
      } else {
        result.logs.push({ cls: 'error', msg: 'system() was called but the argument isn\'t "/bin/sh". Put the "/bin/sh" address (' + hex8(binshAddr) + ') 8 bytes after the go-back address.' });
      }
    } else {
      const isStackAddr = retAddr >= 0xbfff0000 && retAddr < 0xc0000000;
      if (isStackAddr) {
        result.logs.push({ cls: 'error', msg: '\u2192 CRASH: tried to run code on the stack but NX is ON!' });
        result.logs.push({ cls: 'info', msg: 'Jump to system() at <span class="log-addr">' + hex8(systemAddr) + '</span> instead.' });
      } else if (retAddr === symbols.win) {
        result.logs.push({ cls: 'success', msg: '\u2192 Jumped to win()! But try calling system("/bin/sh") for the ret2libc technique.' });
      } else {
        result.logs.push({ cls: 'error', msg: '\u2192 CRASH! Set the go-back address to system() at <span class="log-addr">' + hex8(systemAddr) + '</span>' });
      }
    }
  }

  // ROP chain execution
  if (step.ropChainExec) {
    const retAddr = sim.getRetAddr();
    const retOffset = sim.bufSize + sim.canarySize + sim.ebpSize;

    result.logs.push({ cls: 'action', msg: 'Starting ROP chain from go-back address: <span class="log-addr">' + hex8(retAddr) + '</span>' });

    let esp = retOffset + 4;
    let eip = retAddr;
    let chainOk = true;
    let maxSteps = 20;
    let stepCount = 0;

    let ropEax = state.ropEax ?? 0;
    let ropEbx = state.ropEbx ?? 0;
    let ropFlagValue = state.ropFlagValue ?? 0;

    while (chainOk && stepCount < maxSteps) {
      stepCount++;
      const gadgetStr = ex.gadgets ? ex.gadgets[eip] : undefined;

      if (!gadgetStr) {
        if (eip === symbols.win) {
          result.logs.push({ cls: 'success', msg: '\u2192 EIP = <span class="log-addr">' + hex8(eip) + '</span> = win()!' });
          registerUpdates['eip'] = eip;

          if (ex.flagAddr && ex.magicValue) {
            if (ropFlagValue === ex.magicValue) {
              result.logs.push({ cls: 'success', msg: '\u2192 flag_check == 0x' + ex.magicValue.toString(16) + ' \u2014 condition met!' });
              result.flagUpdates = { ...result.flagUpdates, ropWin: true };
              result.win = { title: ex.winTitle, msg: ex.winMsg };
            } else {
              result.logs.push({ cls: 'error', msg: '\u2192 flag_check is ' + hex8(ropFlagValue) + ', not ' + hex8(ex.magicValue) + '. The ROP chain needs to write the magic value before jumping to win().' });
            }
          }
          break;
        } else {
          result.logs.push({ cls: 'error', msg: '\u2192 EIP = <span class="log-addr">' + hex8(eip) + '</span> \u2014 unknown address! Chain broken.' });
          chainOk = false;
          break;
        }
      }

      result.logs.push({ cls: 'action', msg: 'Execute gadget at <span class="log-addr">' + hex8(eip) + '</span>: <strong>' + gadgetStr + '</strong>' });
      registerUpdates['eip'] = eip;
      registerUpdates['esp'] = sim.baseAddr + esp;

      const parts = gadgetStr.split(';').map(s => s.trim()).filter(s => s && s !== 'ret');

      for (const instr of parts) {
        if (instr.startsWith('pop ')) {
          const reg = instr.split(' ')[1];
          if (esp + 4 <= sim.totalSize) {
            const val = sim._readLE(esp, 4);
            esp += 4;
            result.logs.push({ cls: 'action', msg: '  pop ' + reg + ' \u2192 <span class="log-addr">' + hex8(val) + '</span> (read from stack)' });
            registerUpdates[reg] = val;
            if (reg === 'eax') ropEax = val;
            if (reg === 'ebx') ropEbx = val;
          } else {
            result.logs.push({ cls: 'error', msg: '  pop ' + reg + ' \u2014 ran out of stack data!' });
            chainOk = false;
          }
        } else if (instr === 'mov [ebx], eax') {
          result.logs.push({ cls: 'action', msg: '  mov [ebx], eax \u2192 writing <span class="log-addr">' + hex8(ropEax) + '</span> to address <span class="log-addr">' + hex8(ropEbx) + '</span>' });
          if (ex.flagAddr && ropEbx === ex.flagAddr) {
            ropFlagValue = ropEax;
            result.logs.push({ cls: 'success', msg: '  Wrote to flag_check!' });
          }
        } else if (instr === 'xchg eax, esp') {
          result.logs.push({ cls: 'action', msg: '  xchg eax, esp \u2192 ESP is now <span class="log-addr">' + hex8(ropEax) + '</span> (pivoting stack!)' });
          const newEsp = ropEax - sim.baseAddr;
          if (newEsp >= 0 && newEsp < sim.totalSize) {
            esp = newEsp;
            result.logs.push({ cls: 'success', msg: '  Stack pivoted to buffer! ESP now points into our controlled data.' });
            registerUpdates['esp'] = ropEax;
          } else {
            result.logs.push({ cls: 'error', msg: '  Bad pivot address! ESP points outside our memory.' });
            chainOk = false;
          }
        }
      }

      // ret: pop next EIP from stack
      if (chainOk && esp + 4 <= sim.totalSize) {
        eip = sim._readLE(esp, 4);
        esp += 4;
        result.logs.push({ cls: 'action', msg: '  ret \u2192 pop EIP = <span class="log-addr">' + hex8(eip) + '</span>' });
        registerUpdates['esp'] = sim.baseAddr + esp;
      } else if (chainOk) {
        result.logs.push({ cls: 'error', msg: '  ret \u2014 ran out of stack data!' });
        chainOk = false;
      }
    }

    if (stepCount >= maxSteps) {
      result.logs.push({ cls: 'error', msg: 'Chain too long \u2014 possible infinite loop. Check your payload.' });
    }

    // Store state for external use
    state.ropEax = ropEax;
    state.ropEbx = ropEbx;
    state.ropFlagValue = ropFlagValue;
  }

  // SROP execution
  if (step.sropExec) {
    const retAddr = sim.getRetAddr();
    const sigreturnAddr = symbols.sigreturn || 0x080481b0;

    result.logs.push({ cls: 'action', msg: 'Go-back address: <span class="log-addr">' + hex8(retAddr) + '</span>' });

    if (retAddr === sigreturnAddr) {
      result.logs.push({ cls: 'success', msg: '\u2192 Calling sigreturn()!' });
      result.logs.push({ cls: 'action', msg: 'sigreturn reads the signal frame from the stack and restores all registers...' });

      const frameStart = sim.bufSize + sim.canarySize + sim.ebpSize + sim.retSize;
      if (frameStart + 24 <= sim.totalSize) {
        const eax = sim._readLE(frameStart + 0, 4);
        const ebx = sim._readLE(frameStart + 4, 4);
        const ecx = sim._readLE(frameStart + 8, 4);
        const edx = sim._readLE(frameStart + 12, 4);
        const espVal = sim._readLE(frameStart + 16, 4);
        const eipVal = sim._readLE(frameStart + 20, 4);

        registerUpdates['eax'] = eax;
        registerUpdates['ebx'] = ebx;
        registerUpdates['ecx'] = ecx;
        registerUpdates['edx'] = edx;
        registerUpdates['esp'] = espVal;
        registerUpdates['eip'] = eipVal;

        result.logs.push({ cls: 'action', msg: '  EAX = <span class="log-addr">' + hex8(eax) + '</span>' });
        result.logs.push({ cls: 'action', msg: '  EBX = <span class="log-addr">' + hex8(ebx) + '</span>' });
        result.logs.push({ cls: 'action', msg: '  ECX = <span class="log-addr">' + hex8(ecx) + '</span>' });
        result.logs.push({ cls: 'action', msg: '  EDX = <span class="log-addr">' + hex8(edx) + '</span>' });
        result.logs.push({ cls: 'action', msg: '  ESP = <span class="log-addr">' + hex8(espVal) + '</span>' });
        result.logs.push({ cls: 'action', msg: '  EIP = <span class="log-addr">' + hex8(eipVal) + '</span>' });

        if (eipVal === symbols.win) {
          result.logs.push({ cls: 'success', msg: '\u2192 EIP points to win() \u2014 all registers set in one shot!' });
          result.flagUpdates = { ...result.flagUpdates, sropWin: true };
          result.win = { title: ex.winTitle, msg: ex.winMsg };
        } else {
          result.logs.push({ cls: 'error', msg: '\u2192 EIP = ' + hex8(eipVal) + ' \u2014 that\'s not win() (' + hex8(symbols.win) + '). Set EIP in the signal frame to win\'s address.' });
        }
      } else {
        result.logs.push({ cls: 'error', msg: 'Signal frame doesn\'t fit on the stack! Your payload needs to be longer.' });
      }
    } else {
      result.logs.push({ cls: 'error', msg: '\u2192 Go-back address is <span class="log-addr">' + hex8(retAddr) + '</span> \u2014 should be sigreturn at <span class="log-addr">' + hex8(sigreturnAddr) + '</span>' });
    }
  }

  if (Object.keys(registerUpdates).length > 0) {
    result.registerUpdates = registerUpdates;
  }

  return result;
}
