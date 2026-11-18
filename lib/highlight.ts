/**
 * A very small syntax highlighter for the illustrative snippets (SQL, Python, JSON).
 * Not a parser: just enough tokens to read well. Output is plain data, rendered as real text.
 */

export type TokenType = 'kw' | 'str' | 'num' | 'com' | 'fn' | 'op' | 'txt';
export type Token = { t: TokenType; v: string };

const SQL = new Set(
  'select from where group by order having join left right inner outer on as and or not in is null case when then else end with create replace view table partition over distinct union all limit safe_divide sum count avg min max coalesce cast date timestamp extract between desc asc qualify row_number'.split(
    ' ',
  ),
);
const PY = new Set(
  'def return for in if elif else import from as class with try except raise not and or is none true false lambda yield while pass continue break'.split(
    ' ',
  ),
);
const JSON_KW = new Set(['true', 'false', 'null']);

const RE = /(--[^\n]*|#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`\n]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_])/g;

export function highlight(code: string, lang: 'sql' | 'python' | 'json'): Token[][] {
  const kw = lang === 'sql' ? SQL : lang === 'python' ? PY : JSON_KW;
  return code.split('\n').map((line) => {
    const out: Token[] = [];
    RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RE.exec(line))) {
      const [all, com, str, num, word, space, op] = m;
      if (com !== undefined) {
        // "--" is a comment in SQL only, "#" in Python only.
        const isCom = (lang === 'sql' && com.startsWith('--')) || (lang === 'python' && com.startsWith('#'));
        if (isCom) out.push({ t: 'com', v: com });
        else {
          // Not a comment in this language: emit the first character and rescan the rest.
          out.push({ t: 'op', v: com[0]! });
          RE.lastIndex = m.index + 1;
        }
      } else if (str !== undefined) out.push({ t: 'str', v: str });
      else if (num !== undefined) out.push({ t: 'num', v: num });
      else if (word !== undefined) {
        const rest = line.slice(RE.lastIndex);
        if (kw.has(word.toLowerCase())) out.push({ t: 'kw', v: word });
        else if (/^\s*\(/.test(rest)) out.push({ t: 'fn', v: word });
        else out.push({ t: 'txt', v: word });
      } else if (space !== undefined) out.push({ t: 'txt', v: space });
      else if (op !== undefined) out.push({ t: 'op', v: op });
      else out.push({ t: 'txt', v: all });
    }
    return out;
  });
}
