#!/usr/bin/env python3
"""Remove provably-dead duplicate CSS rule blocks.

A block is removed only when a LATER block in the SAME file has:
  - the exact same selector list (whitespace-normalized),
  - the same @media/@supports context,
  - every property of the earlier block re-declared, and
  - winning importance for each (later !important, or earlier not !important).
Same selector + same context = same specificity, so the later block always wins
for those properties and the earlier block can never affect rendering.

Usage: python dedupe-css.py <file.css> [--write]
"""
import re
import sys


def strip_comments(css):
    return re.sub(r"/\*.*?\*/", lambda m: " " * len(m.group(0)), css, flags=re.S)


def parse_blocks(css):
    """Yield (context, selector, body, start, end) for every leaf rule block."""
    clean = strip_comments(css)
    blocks = []
    stack = []  # at-rule context strings
    i = 0
    n = len(clean)
    while i < n:
        ch = clean[i]
        if ch == "}":
            if stack:
                stack.pop()
            i += 1
            continue
        if ch in " \t\r\n;":
            i += 1
            continue
        # find the next { or } to get the prelude
        j = i
        depth_break = False
        while j < n and clean[j] not in "{}":
            j += 1
        if j >= n:
            break
        if clean[j] == "}":
            i = j
            continue
        prelude = clean[i:j].strip()
        if prelude.startswith("@") and not prelude.startswith(("@font-face", "@page")):
            # at-rule with nested rules (@media, @supports, @keyframes...)
            stack.append(re.sub(r"\s+", " ", prelude))
            i = j + 1
            continue
        # leaf rule: find matching close brace (no nesting in plain CSS)
        k = clean.find("}", j + 1)
        if k == -1:
            break
        body = clean[j + 1:k]
        context = " | ".join(stack)
        # skip rules inside @keyframes - frame selectors repeat legitimately
        if "@keyframes" not in context:
            selector = re.sub(r"\s+", " ", prelude)
            blocks.append((context, selector, body, i, k + 1))
        i = k + 1
    return blocks


def parse_props(body):
    """Return {prop: important_bool} for a declaration body (last wins inside block)."""
    props = {}
    for decl in body.split(";"):
        if ":" not in decl:
            continue
        name, _, value = decl.partition(":")
        name = name.strip().lower()
        if not name:
            continue
        props[name] = "!important" in value.lower()
    return props


def main():
    path = sys.argv[1]
    write = "--write" in sys.argv
    css = open(path, encoding="utf-8", newline="").read()
    blocks = parse_blocks(css)
    by_key = {}
    for block in blocks:
        by_key.setdefault((block[0], block[1]), []).append(block)

    dead = []
    for (context, selector), group in by_key.items():
        if len(group) < 2:
            continue
        for idx, earlier in enumerate(group[:-1]):
            e_props = parse_props(earlier[2])
            if not e_props:
                dead.append(earlier)  # empty block
                continue
            covered = {}
            for later in group[idx + 1:]:
                for prop, important in parse_props(later[2]).items():
                    covered[prop] = covered.get(prop, False) or important
            if all(
                prop in covered and (covered[prop] or not e_imp)
                for prop, e_imp in e_props.items()
            ):
                dead.append(earlier)

    dead.sort(key=lambda b: b[3])
    total_bytes = sum(b[4] - b[3] for b in dead)
    print(f"{len(by_key)} unique (context, selector) keys; "
          f"{sum(1 for g in by_key.values() if len(g) > 1)} duplicated")
    print(f"{len(dead)} provably-dead blocks, {total_bytes} bytes")
    for context, selector, _, start, end in dead:
        line = css[:start].count("\n") + 1
        ctx = f" [{context}]" if context else ""
        print(f"  line {line}: {selector}{ctx}")

    if write and dead:
        out = []
        pos = 0
        for _, _, _, start, end in dead:
            out.append(css[pos:start])
            pos = end
        out.append(css[pos:])
        result = "".join(out)
        # collapse runs of blank lines left behind
        result = re.sub(r"\n{3,}", "\n\n", result)
        open(path, "w", encoding="utf-8", newline="").write(result)
        print(f"WROTE {path}")


if __name__ == "__main__":
    main()
