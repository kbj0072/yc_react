// Improve answer handling for multi-line console output questions.
(function () {
  const originalRenderQuestion = renderQuestion;

  function patchOutputInput() {
    if (!current || current.type !== 'codeOutput') return;
    const old = document.getElementById('answerInput');
    if (!old || old.tagName === 'TEXTAREA') return;

    const area = document.createElement('textarea');
    area.id = 'answerInput';
    area.className = 'output-answer';
    area.rows = 4;
    area.placeholder = '출력 결과를 입력하세요. 여러 줄 출력은 Enter로 줄바꿈하세요.';
    area.value = old.value || '';
    old.replaceWith(area);
  }

  renderQuestion = function (q) {
    originalRenderQuestion(q);
    patchOutputInput();
  };

  // Console output comparison: line breaks and spaces are treated as equivalent separators.
  // This lets both "first\nthird" and "first third" be accepted for simple token output.
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

  // Current question was rendered before this patch script loaded.
  patchOutputInput();
})();
