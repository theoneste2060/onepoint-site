#!/usr/bin/env python3
"""Tiny dependency-free minifier. Usage: python3 tools/minify.py
Reads src/styles.css and src/script.js, writes styles.min.css and script.min.js."""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

def min_css(t):
    out, i, n = [], 0, len(t)
    while i < n:
        c = t[i]
        if t.startswith('/*', i):
            i = t.index('*/', i) + 2; continue
        if c in '"\'':
            j = i + 1
            while t[j] != c:
                j += 2 if t[j] == '\\' else 1
            out.append(t[i:j + 1]); i = j + 1; continue
        out.append(c); i += 1
    s = ''.join(out)
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s*([{};,>])\s*', r'\1', s)
    s = re.sub(r':\s+', ':', s)
    s = s.replace(';}', '}')
    return s.strip()

KEYWORDS = ('return', 'typeof', 'case', 'in', 'of')

def min_js(t):
    # tokenise into (kind, text) so whitespace is only collapsed in code
    toks, i, n, code = [], 0, len(t), []
    def flush():
        if code:
            toks.append(('c', ''.join(code))); code.clear()
    def prev_code():
        for k, x in reversed(toks + [('c', ''.join(code))]):
            if k == 'c' and x.strip(): return x.rstrip()
            if k != 'c': return 'x"'   # a literal precedes: division, not regex
        return ''
    while i < n:
        c = t[i]
        if t.startswith('//', i):
            while i < n and t[i] != '\n': i += 1
            continue
        if t.startswith('/*', i):
            i = t.index('*/', i) + 2; code.append(' '); continue
        if c in '"\'':
            j = i + 1
            while t[j] != c: j += 2 if t[j] == '\\' else 1
            flush(); toks.append(('s', t[i:j + 1])); i = j + 1; continue
        if c == '`':
            j, d = i + 1, 0
            while True:
                if t[j] == '\\': j += 2; continue
                if t[j] == '$' and t[j+1] == '{': d += 1; j += 2; continue
                if t[j] == '}' and d: d -= 1
                elif t[j] == '`' and not d: break
                j += 1
            flush(); toks.append(('s', t[i:j + 1])); i = j + 1; continue
        if c == '/':
            p = prev_code(); last = p[-1:]
            w = re.search(r'[A-Za-z_$][\w$]*$', p)
            if not p or (last in '(,=:[!&|?{};+-*%<>~^') or (w and w.group(0) in KEYWORDS):
                j, cls = i + 1, False
                while True:
                    ch = t[j]
                    if ch == '\\': j += 2; continue
                    if ch == '[': cls = True
                    elif ch == ']': cls = False
                    elif ch == '/' and not cls: break
                    j += 1
                j += 1
                while j < n and t[j].isalpha(): j += 1
                flush(); toks.append(('s', t[i:j])); i = j; continue
        code.append(c); i += 1
    flush()
    res = []
    for k, x in toks:
        if k == 's': res.append(x); continue
        lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in x.split('\n')]
        # keep one newline between non-empty lines (ASI-safe); spaces around punctuation trimmed
        body = '\n'.join(l for l in lines if l)
        res.append(body if x.strip() else (' ' if x else ''))
        # preserve boundary spacing against neighbouring literals
        if x[:1].isspace() and body and res: res[-1] = ' ' + res[-1] if not x.startswith('\n') else '\n' + res[-1]
        if x[-1:].isspace() and body: res[-1] += '\n' if x.endswith('\n') else ' '
    s = ''.join(res)
    s = re.sub(r'\n\s*\n+', '\n', s)
    return s.strip() + '\n'

if __name__ == '__main__':
    css = min_css((ROOT / 'src/styles.css').read_text(encoding='utf8'))
    (ROOT / 'styles.min.css').write_text(css, encoding='utf8')
    js = min_js((ROOT / 'src/script.js').read_text(encoding='utf8'))
    (ROOT / 'script.min.js').write_text(js, encoding='utf8')
    for f in ('src/styles.css', 'src/script.js', 'styles.min.css', 'script.min.js'):
        print(f, (ROOT / f).stat().st_size)
