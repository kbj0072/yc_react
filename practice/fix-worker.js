// Robust JavaScript runner override.
// Uses Function instead of concatenated eval so code-task answers are parsed reliably.
(function () {
  workerRun = function (code, testExpr = null, cb) {
    const workerSrc = `
      const logs = [];
      const fmt = (v) => {
        if (v === undefined) return 'undefined';
        if (v === null) return 'null';
        if (typeof v === 'string') return v;
        try {
          const j = JSON.stringify(v);
          return j === undefined ? String(v) : j;
        } catch (e) {
          return String(v);
        }
      };

      console.log = (...args) => {
        logs.push(args.map(fmt).join(' '));
        return undefined;
      };
      console.error = (...args) => {
        logs.push(args.map(fmt).join(' '));
        return undefined;
      };
      console.warn = (...args) => {
        logs.push(args.map(fmt).join(' '));
        return undefined;
      };

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      self.onmessage = async (e) => {
        try {
          let result = true;

          if (e.data.test) {
            // Compile learner code and test expression in one function scope.
            // This avoids fragile string-eval parsing around function declarations.
            const runner = new Function(
              e.data.code + '\\n' +
              'return (' + e.data.test + ');'
            );
            result = runner();
            if (result && typeof result.then === 'function') {
              result = await result;
            }
          } else {
            const runner = new Function(e.data.code);
            result = runner();
            if (result && typeof result.then === 'function') {
              await result;
            }
            // Let short queued async callbacks such as setTimeout(..., 0)
            // and Promise microtasks write to the captured console.
            await sleep(30);
          }

          postMessage({ ok: true, logs, result: !!result });
        } catch (err) {
          postMessage({
            ok: false,
            logs,
            error: String((err && err.stack) || err)
          });
        }
      };
    `;

    const blob = new Blob([workerSrc], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const w = new Worker(url);
    const timer = setTimeout(() => {
      w.terminate();
      URL.revokeObjectURL(url);
      cb({ ok: false, error: '실행 시간이 너무 길어 중단했습니다.' });
    }, 2000);

    w.onmessage = (e) => {
      clearTimeout(timer);
      w.terminate();
      URL.revokeObjectURL(url);
      cb(e.data);
    };

    w.onerror = (e) => {
      clearTimeout(timer);
      const msg = e && e.message ? e.message : 'Worker 실행 오류';
      w.terminate();
      URL.revokeObjectURL(url);
      cb({ ok: false, error: msg });
    };

    w.postMessage({ code, test: testExpr });
  };
})();
