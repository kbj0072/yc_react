const editor = document.getElementById('editor');
const runBtn = document.getElementById('run-btn');
const output = document.getElementById('output');

function highlight() {
  const code = editor.innerText;
    // .replace(/&/g, '&amp;')
    // .replace(/</g, '&lt;')
    // .replace(/>/g, '&gt;');

  const html = Prism.highlight(code, Prism.languages.javascript, 'javascript');
  editor.innerHTML = html;
  placeCaretAtEnd(editor);
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function runCode() {
  output.innerHTML = '';
  const code = editor.innerText;

  const log = (type, ...args) => {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = `[${type}] ` + args.map(a =>
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    ).join(' ');
    output.appendChild(line);
  };

  const originalLog = console.log;
  const originalErr = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => log('log', ...args);
  console.error = (...args) => log('error', ...args);
  console.warn = (...args) => log('warn', ...args);

  try {
    const fn = new Function(code);
    fn();
  } catch (e) {
    console.error(e);
  }

  console.log = originalLog;
  console.error = originalErr;
  console.warn = originalWarn;
}

function handleClick(customOption) {
  if (customOption?.highlight)
    highlight();
  runCode();
}

runBtn.addEventListener('click', () => handleClick({ highlight: true }));

window.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const key = e.key.toLowerCase();

  const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

  if (!isCtrlOrCmd) return;

  if (key === 'enter') {
    e.preventDefault();
    handleClick({ highlight: false }); // Ctrl + Enter: 코드 실행, (UI 갱신 없음)
  }

  if (key === 'm') {
    e.preventDefault();
    document.getElementById('theme-toggle').click(); // Ctrl + M: 테마 모드 전환
  }
});


window.addEventListener('DOMContentLoaded', () => {
  highlight();
  runCode();
});

//editor.addEventListener('input', highlight);

editor.addEventListener('paste', (e) => {
  e.preventDefault();

  const text = e.clipboardData.getData('text/plain');

  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  sel.deleteFromDocument();
  sel.getRangeAt(0).insertNode(document.createTextNode(text));
  
  sel.collapseToEnd();
});