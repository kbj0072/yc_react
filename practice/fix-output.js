// Improvements found during full question-bank validation.
(function () {
  const originalRenderQuestion = renderQuestion;

  function patchOutputInput() {
    if (!current || current.type !== 'codeOutput') return;
    const old = document.getElementById('answerInput');
    if (!old || old.tagName === 'TEXTAREA') return;

    const area = document.createElement('textarea');
    area.id = 'answerInput';
    area.className = 'output-answer';
    area.rows = 3;
    area.placeholder = '출력 결과를 입력하세요. 여러 줄 출력은 Enter로 줄바꿈하세요.';
    area.value = old.value || '';
    old.replaceWith(area);
  }

  renderQuestion = function (q) {
    originalRenderQuestion(q);
    patchOutputInput();
  };

  // Console output comparison: line breaks and spaces are treated as equivalent separators.
  function normalizeOutput(v) {
    return String(v ?? '')
      .trim()
      .replace(/\r/g, '')
      .replace(/\s+/g, ' ');
  }

  function improvedCheck() {
    if (!current) return;
    const a = userAnswer();
    let ok = false;

    if (current.type === 'tf' || current.type === 'choice') {
      ok = (a === current.answer);
    } else if (current.type === 'codeTask') {
      runTask(true);
      return;
    } else if (current.type === 'codeOutput') {
      ok = normalizeOutput(a) === normalizeOutput(current.answer);
    } else {
      ok = norm(a).replace(/\s/g, '') === norm(current.answer).replace(/\s/g, '');
    }

    record(ok, a);
    showFeedback(ok);
  }

  check = improvedCheck;
  document.getElementById('checkBtn').onclick = improvedCheck;

  // Fix the sandbox runner.
  // 1) console.log must return undefined, just like the real console.log.
  //    Returning Array.push()'s result changes short-circuit expressions.
  // 2) undefined must be displayed as "undefined", not as an empty string.
  // 3) Give microtasks/setTimeout(0) a short chance to finish before collecting logs.
  workerRun = function (code, testExpr = null, cb) {
    const workerSrc = `
      const logs = [];
      const fmt = (v) => {
        if (typeof v === 'string') return v;
        if (v === undefined) return 'undefined';
        if (v === null) return 'null';
        try {
          const json = JSON.stringify(v);
          return json === undefined ? String(v) : json;
        } catch (e) {
          return String(v);
        }
      };
      console.log = (...args) => {
        logs.push(args.map(fmt).join(' '));
        // no return value: console.log must evaluate to undefined
      };
      console.error = (...args) => {
        logs.push(args.map(fmt).join(' '));
      };
      console.warn = (...args) => {
        logs.push(args.map(fmt).join(' '));
      };
      self.onmessage = async (e) => {
        try {
          let result;
          if (e.data.test) {
            result = (0, eval)(e.data.code + "\\n;(\"use strict\", " + e.data.test + ")");
          } else {
            result = (0, eval)(e.data.code);
          }
          if (result && typeof result.then === 'function') result = await result;
          // Capture Promise microtasks and short timers used by output-prediction questions.
          await new Promise(resolve => setTimeout(resolve, 30));
          postMessage({ ok: true, logs, result: !!result });
        } catch (err) {
          postMessage({ ok: false, logs, error: String(err && err.stack || err) });
        }
      };
    `;

    const blob = new Blob([workerSrc], { type: 'application/javascript' });
    const w = new Worker(URL.createObjectURL(blob));
    const timer = setTimeout(() => {
      w.terminate();
      cb({ ok: false, error: '실행 시간이 너무 길어 중단했습니다.' });
    }, 1800);

    w.onmessage = (e) => {
      clearTimeout(timer);
      w.terminate();
      cb(e.data);
    };
    w.onerror = (e) => {
      clearTimeout(timer);
      const msg = e && e.message ? e.message : 'Worker 실행 오류';
      w.terminate();
      cb({ ok: false, error: msg });
    };
    w.postMessage({ code, test: testExpr });
  };

  // Strengthen the two asynchronous coding tasks.
  const runLaterQuestion = QUESTIONS.find(q => q.id === 'as6');
  if (runLaterQuestion) {
    runLaterQuestion.test = `(async()=>{
      let called = false;
      const started = Date.now();
      runLater(() => { called = true; });
      await new Promise(resolve => setTimeout(resolve, 140));
      return called && Date.now() - started >= 80;
    })()`;
  }

  const promiseQuestion = QUESTIONS.find(q => q.id === 'as16');
  if (promiseQuestion) {
    promiseQuestion.test = `(async()=>{
      const p = makePromise(5);
      return p instanceof Promise && (await p) === 5;
    })()`;
  }

  // Current question was rendered before this patch script loaded.
  patchOutputInput();
})();
