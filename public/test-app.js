/* ═══════════════════════════════════════════════════════════════════════════
   PTEMaster — Test Engine
   Handles all 20 PTE question types with audio, recording, and scoring
═══════════════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);
const API = async (path, opts = {}) => {
  const token = localStorage.getItem('pte_token');
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

/* ── State ─────────────────────────────────────────────────────────────────── */
let test = null;
let attempt = null;
let questions = [];
let currentIdx = 0;
let answers = {};          // { questionId: userAnswer }
let sectionTimer = null;
let questionTimer = null;
let timeLeft = 0;
let startTime = Date.now();
let mediaRecorder = null;
let audioChunks = [];
let currentRecording = null;  // blob URL
let speechSynth = window.speechSynthesis;
let currentUtterance = null;
let audioPlayed = false;
let reorderDragItem = null;

/* ── Entry ─────────────────────────────────────────────────────────────────── */
const params = new URLSearchParams(location.search);
const testId = params.get('id');
const resultsId = params.get('results');

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('pte_token')) {
    location.href = 'dashboard.html';
    return;
  }

  if (resultsId) {
    await showResults(resultsId);
  } else if (testId) {
    await loadTest();
  } else {
    location.href = 'dashboard.html';
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   LOAD TEST
═══════════════════════════════════════════════════════════════════════════ */
async function loadTest() {
  render(`<div class="test-layout"><div class="test-body" style="display:flex;align-items:center;justify-content:center;flex:1"><div class="spinner"></div></div></div>`);

  try {
    test = await API(`/api/tests/${testId}`);
    questions = test.questions;

    // Start attempt
    const att = await API('/api/attempts', { method: 'POST', body: JSON.stringify({ test_id: testId }) });
    attempt = att;

    showIntro();
  } catch (e) {
    if (e.freeLimit) {
      render(`<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg)">
        <div class="modal" style="max-width:480px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">🔒</div>
          <h2>Free Limit Reached</h2>
          <p style="color:var(--text-muted);margin-bottom:24px">You've used your 2 free mock tests. Upgrade to continue practicing.</p>
          <a href="dashboard.html?signup=1" class="btn btn-primary btn-block" style="margin-bottom:8px">Upgrade to Unlimited</a>
          <a href="dashboard.html" class="btn btn-ghost btn-block">Back to Dashboard</a>
        </div>
      </div>`);
    } else {
      render(`<div style="display:flex;align-items:center;justify-content:center;height:100vh">
        <div class="modal"><h2>Error</h2><p>${e.error || 'Failed to load test'}</p><a href="dashboard.html" class="btn btn-primary">Back</a></div>
      </div>`);
    }
  }
}

/* ── Intro screen ──────────────────────────────────────────────────────────── */
function showIntro() {
  const sectionCounts = {};
  questions.forEach(q => { sectionCounts[q.section] = (sectionCounts[q.section] || 0) + 1; });

  render(`
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg);padding:24px">
    <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:40px;max-width:600px;width:100%;box-shadow:var(--shadow-lg)">
      <div style="text-align:center;margin-bottom:32px">
        <div style="font-size:48px;margin-bottom:16px">📝</div>
        <h1 style="font-size:24px;font-weight:800;margin-bottom:8px">${test.title}</h1>
        <p style="color:var(--text-muted)">${test.description || 'Complete all questions to receive your score.'}</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:28px">
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--blue)">${test.duration}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Minutes</div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--purple)">${questions.length}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Questions</div>
        </div>
      </div>

      <div class="alert alert-info" style="margin-bottom:24px;font-size:13px">
        <strong>Before you begin:</strong> Ensure your microphone is connected for speaking tasks. Audio for listening questions plays once. Do not refresh the page during the test.
      </div>

      <div style="margin-bottom:24px">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Sections in this test:</h3>
        ${Object.entries(sectionCounts).map(([s, c]) => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:14px">
            <span style="text-transform:capitalize;font-weight:500">${s}</span>
            <span class="chip chip-gray">${c} question${c>1?'s':''}</span>
          </div>`).join('')}
      </div>

      <button class="btn btn-primary btn-block btn-lg" onclick="startTest()">Begin Test</button>
      <a href="dashboard.html" class="btn btn-ghost btn-block" style="margin-top:8px">Cancel</a>
    </div>
  </div>`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEST INTERFACE
═══════════════════════════════════════════════════════════════════════════ */
function startTest() {
  startTime = Date.now();
  timeLeft = test.duration * 60;
  renderTestShell();
  goToQuestion(0);
  startGlobalTimer();
}

function renderTestShell() {
  render(`
  <div class="test-layout">
    <div class="test-topbar">
      <div class="test-topbar-logo">PTE<span>Master</span></div>
      <div class="test-section-name" id="topbar-section"></div>
      <div class="test-progress-bar">
        <div class="test-progress-track"><div class="test-progress-fill" id="progress-fill" style="width:0%"></div></div>
      </div>
      <div style="font-size:12px;color:#94a3b8;white-space:nowrap" id="q-counter"></div>
      <div class="test-timer" id="global-timer">--:--</div>
    </div>

    <div class="test-body">
      <div class="question-sidebar">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Questions</div>
        <div class="q-nav-grid" id="q-nav-grid"></div>
      </div>

      <div class="question-area" id="question-area">
        <div class="spinner"></div>
      </div>
    </div>
  </div>`);
}

function updateQNavGrid() {
  const grid = $('q-nav-grid');
  if (!grid) return;
  grid.innerHTML = questions.map((q, i) => {
    let cls = 'q-nav-btn';
    if (i === currentIdx) cls += ' current';
    else if (answers[q.id] !== undefined) cls += ' answered';
    return `<button class="${cls}" onclick="goToQuestion(${i})">${i + 1}</button>`;
  }).join('');
}

function updateProgress() {
  const pct = ((currentIdx + 1) / questions.length) * 100;
  const fill = $('progress-fill');
  if (fill) fill.style.width = pct + '%';
  const counter = $('q-counter');
  if (counter) counter.textContent = `${currentIdx + 1}/${questions.length}`;
  const sn = $('topbar-section');
  if (sn) {
    const q = questions[currentIdx];
    sn.textContent = q ? (q.section.charAt(0).toUpperCase() + q.section.slice(1)) + ' — ' + formatType(q.type) : '';
  }
}

function formatType(type) {
  const labels = {
    speaking_read_aloud: 'Read Aloud',
    speaking_repeat_sentence: 'Repeat Sentence',
    speaking_describe_image: 'Describe Image',
    speaking_retell_lecture: 'Re-tell Lecture',
    speaking_answer_short: 'Answer Short Question',
    writing_summarize_text: 'Summarize Written Text',
    writing_essay: 'Write Essay',
    reading_rw_fill_blanks: 'Reading & Writing: Fill in the Blanks',
    reading_mcma: 'Multiple Choice, Multiple Answers',
    reading_reorder: 'Re-order Paragraphs',
    reading_fill_blanks: 'Reading: Fill in the Blanks',
    reading_mcsa: 'Multiple Choice, Single Answer',
    listening_summarize: 'Summarize Spoken Text',
    listening_mcma: 'Multiple Choice, Multiple Answers',
    listening_fill_blanks: 'Fill in the Blanks',
    listening_highlight_summary: 'Highlight Correct Summary',
    listening_mcsa: 'Multiple Choice, Single Answer',
    listening_missing_word: 'Select Missing Word',
    listening_highlight_incorrect: 'Highlight Incorrect Words',
    listening_write_dictation: 'Write from Dictation',
  };
  return labels[type] || type;
}

/* ── Question navigation ─────────────────────────────────────────────────── */
async function goToQuestion(idx) {
  // Stop any running audio/recording
  stopSpeech();
  stopRecording();

  currentIdx = idx;
  const q = questions[idx];
  updateProgress();
  updateQNavGrid();

  const area = $('question-area');
  if (!area) return;
  area.innerHTML = renderQuestion(q, answers[q.id]);
  bindQuestionInteractions(q);
}

async function submitCurrentAndNext() {
  const q = questions[currentIdx];
  const answer = collectAnswer(q);

  try {
    await API(`/api/attempts/${attempt.attempt_id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: q.id, user_answer: answer, question_index: currentIdx }),
    });
    answers[q.id] = answer;
    updateQNavGrid();
  } catch (e) { console.error('Submit error', e); }

  if (currentIdx < questions.length - 1) {
    goToQuestion(currentIdx + 1);
  } else {
    await completeTest();
  }
}

async function completeTest() {
  stopSpeech();
  stopRecording();
  clearInterval(sectionTimer);

  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  try {
    const results = await API(`/api/attempts/${attempt.attempt_id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ time_spent: timeSpent }),
    });
    await showResults(attempt.attempt_id);
  } catch (e) {
    console.error(e);
    location.href = 'dashboard.html';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   QUESTION RENDERERS
═══════════════════════════════════════════════════════════════════════════ */
function renderQuestion(q, existing) {
  const typeLabel = formatType(q.type);
  const instructions = getInstructions(q.type);

  return `
  <div class="question-card">
    <div class="question-type-label">
      <span class="qtype-badge ${q.section}">${q.section}</span>
      ${typeLabel}
    </div>
    ${q.title ? `<div class="question-title">${q.title}</div>` : ''}
    <div class="question-instructions">${instructions}</div>

    <div id="question-body">
      ${renderQuestionBody(q, existing)}
    </div>

    <div class="question-footer">
      <span class="question-counter">Question ${currentIdx + 1} of ${questions.length}</span>
      <div style="display:flex;gap:8px">
        ${currentIdx > 0 ? `<button class="btn btn-ghost" onclick="goToQuestion(${currentIdx - 1})">← Back</button>` : ''}
        <button class="btn btn-primary" id="next-btn" onclick="submitCurrentAndNext()">
          ${currentIdx === questions.length - 1 ? 'Submit Test' : 'Next →'}
        </button>
      </div>
    </div>
  </div>`;
}

function getInstructions(type) {
  const inst = {
    speaking_read_aloud: 'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible.',
    speaking_repeat_sentence: 'You will hear a sentence. After listening, repeat the sentence exactly as you heard it.',
    speaking_describe_image: 'Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing.',
    speaking_retell_lecture: 'You will hear a lecture. After listening, retell what you heard in your own words.',
    speaking_answer_short: 'You will hear a question. Answer it with a single word or short phrase.',
    writing_summarize_text: 'Read the passage below and summarize it using one sentence. Type your response in the box. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.',
    writing_essay: 'You will have 20 minutes to plan, write, and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your essay, and control the language you use to express your ideas. You should write 200–300 words.',
    reading_rw_fill_blanks: 'In the text below some words are missing. Drag words from the box below to the appropriate place in the text.',
    reading_mcma: 'Read the text and answer the question below by selecting all the correct responses. More than one response is correct.',
    reading_reorder: 'The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.',
    reading_fill_blanks: 'Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.',
    reading_mcsa: 'Read the text and answer the question by selecting the best response.',
    listening_summarize: 'You will hear a short lecture. Write a summary for a fellow student who was not present. You should write 50–70 words. You have 10 minutes to finish this task.',
    listening_mcma: 'Listen to the recording and answer the question by selecting all the correct responses.',
    listening_fill_blanks: 'You will hear a recording. Type the missing words in each blank.',
    listening_highlight_summary: 'You will hear a recording. Click on the paragraph that best relates to the recording.',
    listening_mcsa: 'Listen to the recording and answer the question by selecting the best response.',
    listening_missing_word: 'You will hear a recording. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.',
    listening_highlight_incorrect: 'You will hear a recording. Below is a transcript of the recording. Some words in the transcript differ from what the speaker said. Click on the words that are different.',
    listening_write_dictation: 'You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.',
  };
  return inst[type] || 'Answer the question below.';
}

function renderQuestionBody(q, existing) {
  const c = q.content;

  switch (q.type) {
    case 'speaking_read_aloud':
      return renderReadAloud(q, c, existing);

    case 'speaking_repeat_sentence':
    case 'speaking_answer_short':
      return renderSpeakingWithAudio(q, c, existing);

    case 'speaking_describe_image':
      return renderDescribeImage(q, c, existing);

    case 'speaking_retell_lecture':
      return renderRetellLecture(q, c, existing);

    case 'writing_summarize_text':
      return renderWritingTask(q, c, existing, 75, 'Write your one-sentence summary here…');

    case 'writing_essay':
      return renderWritingTask(q, c, existing, 300, 'Write your essay here…', 200);

    case 'reading_rw_fill_blanks':
      return renderRWFillBlanks(q, c, existing);

    case 'reading_mcma':
    case 'listening_mcma':
      return renderMCMA(q, c, existing);

    case 'reading_reorder':
      return renderReorder(q, c, existing);

    case 'reading_fill_blanks':
      return renderReadingFillBlanks(q, c, existing);

    case 'reading_mcsa':
    case 'listening_highlight_summary':
    case 'listening_mcsa':
    case 'listening_missing_word':
      return renderMCSA(q, c, existing);

    case 'listening_summarize':
      return renderListeningSummarize(q, c, existing);

    case 'listening_fill_blanks':
      return renderListeningFillBlanks(q, c, existing);

    case 'listening_highlight_incorrect':
      return renderHighlightIncorrect(q, c, existing);

    case 'listening_write_dictation':
      return renderWriteDictation(q, c, existing);

    default:
      return `<div class="alert alert-warn">Question type "${q.type}" — renderer coming soon.</div>`;
  }
}

/* ── Speaking: Read Aloud ──────────────────────────────────────────────────── */
function renderReadAloud(q, c, existing) {
  return `
  <div class="passage-text">${c.text || ''}</div>
  <div class="speaking-area">
    <div class="speaking-status" id="speak-status">Prepare to read. Recording starts in 40 seconds.</div>
    <div class="speaking-timer-display" id="speak-timer">40</div>
    <div class="recording-indicator" id="rec-indicator" style="display:none">
      <div class="rec-dot"></div> Recording
    </div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button class="btn btn-primary" id="start-record-btn" onclick="startSpeakingTask(40, ${q.time_limit || 35})">
        🎙️ Start Recording
      </button>
      <button class="btn btn-ghost" id="stop-record-btn" onclick="stopRecording()" disabled>Stop</button>
    </div>
    ${existing && existing.recorded ? `<div class="alert alert-success" style="margin-top:12px">✓ Response recorded</div>` : ''}
  </div>`;
}

/* ── Speaking: with audio ─────────────────────────────────────────────────── */
function renderSpeakingWithAudio(q, c, existing) {
  return `
  ${renderAudioPlayer(q)}
  <div class="speaking-area">
    <div class="speaking-status" id="speak-status">Listen to the audio, then record your response.</div>
    <div class="speaking-timer-display" id="speak-timer">${q.time_limit || 15}</div>
    <div class="recording-indicator" id="rec-indicator" style="display:none">
      <div class="rec-dot"></div> Recording
    </div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button class="btn btn-primary" id="start-record-btn" onclick="startSpeakingTask(0, ${q.time_limit || 15})">
        🎙️ Record Response
      </button>
      <button class="btn btn-ghost" id="stop-record-btn" onclick="stopRecording()" disabled>Stop</button>
    </div>
    ${existing && existing.recorded ? `<div class="alert alert-success" style="margin-top:12px">✓ Response recorded</div>` : ''}
  </div>`;
}

/* ── Describe Image ───────────────────────────────────────────────────────── */
function renderDescribeImage(q, c, existing) {
  let chartHtml = '';
  if (c.image_type === 'bar_chart' && c.data) {
    chartHtml = `<canvas id="img-chart" style="max-height:300px"></canvas>`;
  } else if (c.image_type === 'pie_chart' && c.data) {
    chartHtml = `<canvas id="img-chart" style="max-height:300px"></canvas>`;
  } else if (c.image_type === 'line_graph' && c.data) {
    chartHtml = `<canvas id="img-chart" style="max-height:300px"></canvas>`;
  } else if (c.image_type === 'table' && c.data) {
    chartHtml = `<div class="table-wrap">${renderTable(c.data)}</div>`;
  } else {
    chartHtml = `<div class="passage-text">${c.description || 'Image description'}</div>`;
  }

  return `
  <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:20px">
    ${chartHtml}
    ${c.description ? `<p style="font-size:12px;color:var(--text-muted);margin-top:8px;text-align:center">${c.description}</p>` : ''}
  </div>
  <div class="speaking-area">
    <div class="speaking-status" id="speak-status">Study the image. You have 25 seconds before recording begins.</div>
    <div class="speaking-timer-display" id="speak-timer">25</div>
    <div class="recording-indicator" id="rec-indicator" style="display:none">
      <div class="rec-dot"></div> Recording — describe the image
    </div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button class="btn btn-primary" id="start-record-btn" onclick="startSpeakingTask(25, ${q.time_limit || 40})">
        🎙️ Start Recording
      </button>
      <button class="btn btn-ghost" id="stop-record-btn" onclick="stopRecording()" disabled>Stop</button>
    </div>
    ${existing && existing.recorded ? `<div class="alert alert-success" style="margin-top:12px">✓ Response recorded</div>` : ''}
  </div>`;
}

function renderTable(data) {
  if (!data.headers || !data.rows) return '';
  return `<table><thead><tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${data.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
  </tbody></table>`;
}

/* ── Re-tell Lecture ─────────────────────────────────────────────────────── */
function renderRetellLecture(q, c, existing) {
  return `
  ${renderAudioPlayer(q, 'Listen to the lecture carefully. You may take notes below.')}
  <div class="form-group" style="margin-bottom:12px">
    <label>Notes (optional — not scored)</label>
    <textarea class="writing-textarea" style="min-height:80px" placeholder="Jot down key points…" id="lecture-notes"></textarea>
  </div>
  <div class="speaking-area">
    <div class="speaking-status" id="speak-status">After listening, retell the lecture.</div>
    <div class="speaking-timer-display" id="speak-timer">${q.time_limit || 40}</div>
    <div class="recording-indicator" id="rec-indicator" style="display:none">
      <div class="rec-dot"></div> Recording
    </div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button class="btn btn-primary" id="start-record-btn" onclick="startSpeakingTask(0, ${q.time_limit || 40})">
        🎙️ Record Retelling
      </button>
      <button class="btn btn-ghost" id="stop-record-btn" onclick="stopRecording()" disabled>Stop</button>
    </div>
    ${existing && existing.recorded ? `<div class="alert alert-success" style="margin-top:12px">✓ Response recorded</div>` : ''}
  </div>`;
}

/* ── Audio Player ─────────────────────────────────────────────────────────── */
function renderAudioPlayer(q, hint = '') {
  return `
  <div class="audio-player" id="audio-player">
    <button class="audio-play-btn" id="audio-btn" onclick="playAudio()" title="Play audio">▶</button>
    <div class="audio-progress">
      ${hint ? `<div class="audio-label">${hint}</div>` : ''}
      <div class="audio-label" id="audio-status">Click play to listen (plays once)</div>
      <div class="audio-track"><div class="audio-fill" id="audio-fill" style="width:0%"></div></div>
    </div>
    <span class="audio-note" id="audio-plays-left">1 play remaining</span>
  </div>`;
}

/* ── Writing tasks ───────────────────────────────────────────────────────── */
function renderWritingTask(q, c, existing, maxWords, placeholder, minWords = 0) {
  const existingText = existing && existing.text ? existing.text : '';
  const prompt = c.text || c.prompt || '';

  return `
  <div class="passage-text">${prompt}</div>
  <div class="writing-area">
    <div class="writing-toolbar">
      <span>${minWords ? `${minWords}–${maxWords} words required` : `Max ${maxWords} words`}</span>
      <span>Time: ${q.time_limit ? Math.round(q.time_limit / 60) + ' min' : '—'}</span>
    </div>
    <textarea class="writing-textarea" id="writing-input" placeholder="${placeholder}" oninput="updateWordCount(this, ${maxWords})">${existingText}</textarea>
    <div class="word-count" id="word-count">0 words</div>
  </div>`;
}

function updateWordCount(el, max) {
  const words = el.value.trim().split(/\s+/).filter(Boolean).length;
  const el2 = $('word-count');
  if (!el2) return;
  el2.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  el2.className = 'word-count' + (words > max ? ' over' : words > 0 ? ' good' : '');
}

/* ── Reading & Writing Fill Blanks ──────────────────────────────────────── */
function renderRWFillBlanks(q, c, existing) {
  let text = c.text || '';
  const blanks = c.blanks || [];
  const existingAnswers = existing && existing.answers ? existing.answers : [];

  blanks.forEach((blank, i) => {
    const existingVal = existingAnswers.find(a => a.id === i)?.word || '';
    const options = blank.options || [];
    const selectHtml = `<select class="blank-select" data-blank="${i}" onchange="markAnswered()">
      <option value="">— select —</option>
      ${options.map(opt => `<option value="${opt}" ${existingVal === opt ? 'selected' : ''}>${opt}</option>`).join('')}
    </select>`;
    text = text.replace(`{{blank_${i}}}`, selectHtml);
  });

  return `<div class="passage-text">${text}</div>`;
}

/* ── Multiple Choice Multiple Answers ───────────────────────────────────── */
function renderMCMA(q, c, existing) {
  const selected = existing && existing.selected ? new Set(existing.selected) : new Set();
  const options = c.options || [];
  const questionText = c.question || c.text || '';

  return `
  ${q.audio_text ? renderAudioPlayer(q) : ''}
  ${questionText && !q.audio_text ? `<div class="passage-text">${c.text || ''}</div>` : ''}
  <p style="font-weight:600;margin-bottom:12px">${c.question || 'Which of the following are correct?'}</p>
  <div class="mcq-options">
    ${options.map(opt => `
      <label class="mcq-option ${selected.has(opt.id) ? 'selected' : ''}">
        <input type="checkbox" name="mcma_${q.id}" value="${opt.id}" ${selected.has(opt.id) ? 'checked' : ''} onchange="toggleMCMA(this)"/>
        <span class="mcq-option-text">${opt.id}. ${opt.text}</span>
      </label>`).join('')}
  </div>
  <p style="font-size:12px;color:var(--text-muted);margin-top:8px">Select all correct answers. Note: wrong selections result in a penalty.</p>`;
}

/* ── Multiple Choice Single Answer ──────────────────────────────────────── */
function renderMCSA(q, c, existing) {
  const selected = existing && existing.selected ? existing.selected : null;
  const options = c.options || [];

  return `
  ${q.audio_text ? renderAudioPlayer(q) : ''}
  ${c.text ? `<div class="passage-text">${c.text}</div>` : ''}
  <p style="font-weight:600;margin-bottom:12px">${c.question || 'Choose the best answer:'}</p>
  <div class="mcq-options">
    ${options.map(opt => `
      <label class="mcq-option ${selected === opt.id ? 'selected' : ''}" onclick="selectMCSA('${opt.id}', this)">
        <input type="radio" name="mcsa_${q.id}" value="${opt.id}" ${selected === opt.id ? 'checked' : ''}/>
        <span class="mcq-option-text">${opt.id}. ${opt.text}</span>
      </label>`).join('')}
  </div>`;
}

/* ── Re-order Paragraphs ─────────────────────────────────────────────────── */
function renderReorder(q, c, existing) {
  const paragraphs = c.paragraphs || [];
  const existingOrder = existing && existing.order ? existing.order : [];

  const bankItems = paragraphs.filter(p => !existingOrder.includes(p.id));
  const answerItems = existingOrder.map(id => paragraphs.find(p => p.id === id)).filter(Boolean);

  return `
  <div class="reorder-container" id="reorder-container">
    <div class="reorder-bank" id="reorder-bank">
      <h4>Source (drag from here)</h4>
      ${bankItems.map(p => `
        <div class="reorder-item" draggable="true" data-id="${p.id}" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropOnItem(event)">
          <div class="para-label">${p.id}</div>
          ${p.text}
        </div>`).join('')}
    </div>
    <div class="reorder-answer" id="reorder-answer" ondragover="dragOver(event)" ondrop="dropOnAnswer(event)">
      <h4>Answer (correct order)</h4>
      ${answerItems.map(p => `
        <div class="reorder-item" draggable="true" data-id="${p.id}" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropOnItem(event)">
          <div class="para-label">${p.id}</div>
          ${p.text}
        </div>`).join('')}
    </div>
  </div>
  <p style="font-size:12px;color:var(--text-muted);margin-top:8px">Drag all text boxes from the left panel to the right panel in the correct order.</p>`;
}

/* ── Reading Fill Blanks (word bank) ────────────────────────────────────── */
function renderReadingFillBlanks(q, c, existing) {
  let text = c.text || '';
  const wordBank = c.word_bank || [];
  const existingAnswers = existing && existing.answers ? existing.answers : [];

  let blankCount = 0;
  text = text.replace(/\{\{blank_(\d+)\}\}/g, (match, id) => {
    const existingVal = existingAnswers.find(a => a.id === parseInt(id))?.word || '';
    blankCount++;
    return `<input class="blank-input" data-blank="${id}" value="${existingVal}" placeholder="___" oninput="markAnswered()"/>`;
  });

  const usedWords = new Set(existingAnswers.map(a => a.word));

  return `
  <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Click on a blank, then click a word from the bank to fill it. Or type directly.</p>
  <div class="word-bank">
    ${wordBank.map(w => `<span class="word-token ${usedWords.has(w) ? 'used' : ''}" onclick="fillBlankFromBank('${w}', this)">${w}</span>`).join('')}
  </div>
  <div class="passage-text" id="rfib-text">${text}</div>`;
}

/* ── Listening: Summarize ────────────────────────────────────────────────── */
function renderListeningSummarize(q, c, existing) {
  const existingText = existing && existing.text ? existing.text : '';
  return `
  ${renderAudioPlayer(q, 'Listen to the lecture, then write your summary.')}
  <div class="writing-area">
    <div class="writing-toolbar"><span>50–70 words required</span><span>10 minutes</span></div>
    <textarea class="writing-textarea" id="writing-input" placeholder="Write your summary here (50–70 words)…" oninput="updateWordCount(this, 70)">${existingText}</textarea>
    <div class="word-count" id="word-count">0 words</div>
  </div>`;
}

/* ── Listening: Fill Blanks ──────────────────────────────────────────────── */
function renderListeningFillBlanks(q, c, existing) {
  let text = c.text || '';
  const existingAnswers = existing && existing.answers ? existing.answers : [];

  text = text.replace(/\{\{blank_(\d+)\}\}/g, (match, id) => {
    const val = existingAnswers.find(a => a.id === parseInt(id))?.word || '';
    return `<input class="blank-input" data-blank="${id}" value="${val}" placeholder="___" oninput="markAnswered()"/>`;
  });

  return `
  ${renderAudioPlayer(q, 'Listen and fill in the missing words.')}
  <div class="passage-text" id="lfib-text">${text}</div>`;
}

/* ── Highlight Incorrect Words ───────────────────────────────────────────── */
function renderHighlightIncorrect(q, c, existing) {
  const selected = new Set(existing && existing.selected ? existing.selected : []);
  const words = (c.transcript || '').split(/\s+/);

  const html = words.map((w, i) => {
    const clean = w.replace(/[.,!?;:]/g, '');
    const punct = w.slice(clean.length);
    return `<span class="hw-word ${selected.has(clean) ? 'selected' : ''}" data-word="${clean}" onclick="toggleHighlight(this)">${clean}</span>${punct} `;
  }).join('');

  return `
  ${renderAudioPlayer(q, 'Listen to the recording. Click words that differ from what you hear.')}
  <div class="highlight-text">${html}</div>
  <p style="font-size:12px;color:var(--text-muted);margin-top:8px">Click on words that are different from what the speaker says. Click again to deselect.</p>`;
}

/* ── Write from Dictation ────────────────────────────────────────────────── */
function renderWriteDictation(q, c, existing) {
  const existingText = existing && existing.text ? existing.text : '';
  return `
  ${renderAudioPlayer(q, 'Listen carefully. The audio plays once only.')}
  <div class="form-group">
    <label>Type what you heard:</label>
    <input type="text" id="dictation-input" value="${existingText}" placeholder="Type the sentence exactly as heard…" style="font-size:15px" oninput="markAnswered()"/>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTERACTIONS
═══════════════════════════════════════════════════════════════════════════ */
function bindQuestionInteractions(q) {
  // Auto-play audio for listening questions
  if (q.section === 'listening' && q.audio_text) {
    setTimeout(() => {
      const audioBtnEl = $('audio-btn');
      if (audioBtnEl) playAudio();
    }, 1000);
  }

  // Render chart if describe image
  if (q.type === 'speaking_describe_image') {
    const canvas = $('img-chart');
    if (canvas && q.content.data) {
      const type = q.content.image_type;
      renderChart(canvas, type, q.content.data);
    }
  }
}

/* ── Audio / TTS ─────────────────────────────────────────────────────────── */
let audioPlaysRemaining = 1;

function playAudio() {
  const q = questions[currentIdx];
  if (!q.audio_text) return;

  const btn = $('audio-btn');
  const status = $('audio-status');
  const playsLeft = $('audio-plays-left');
  const fill = $('audio-fill');

  if (audioPlaysRemaining <= 0) {
    status.textContent = 'Audio has already been played.';
    return;
  }

  stopSpeech();
  audioPlaysRemaining--;
  if (playsLeft) playsLeft.textContent = audioPlaysRemaining > 0 ? `${audioPlaysRemaining} play remaining` : 'No replays';
  if (btn) { btn.disabled = true; btn.textContent = '⏸'; }
  if (status) status.textContent = 'Playing…';

  // Reset per-question counter
  audioPlayed = true;

  const utter = new SpeechSynthesisUtterance(q.audio_text);
  utter.rate = 0.95;
  utter.pitch = 1;
  utter.lang = 'en-AU';

  // Progress animation
  const duration = q.audio_text.split(' ').length * 380; // rough ms estimate
  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 100;
    if (fill) fill.style.width = Math.min((elapsed / duration) * 100, 100) + '%';
    if (elapsed >= duration) clearInterval(interval);
  }, 100);

  utter.onend = () => {
    clearInterval(interval);
    if (fill) fill.style.width = '100%';
    if (btn) {
      btn.disabled = audioPlaysRemaining <= 0;
      btn.textContent = '▶';
    }
    if (status) status.textContent = 'Audio finished.';
  };

  currentUtterance = utter;
  speechSynth.speak(utter);
}

function stopSpeech() {
  if (speechSynth.speaking) speechSynth.cancel();
  currentUtterance = null;
  audioPlaysRemaining = 1;
}

/* ── Recording ───────────────────────────────────────────────────────────── */
let prepTimer = null;
let respTimer = null;

async function startSpeakingTask(prepSeconds, recordSeconds) {
  const startBtn = $('start-record-btn');
  if (startBtn) startBtn.style.display = 'none';

  if (prepSeconds > 0) {
    await runTimer('speak-timer', 'speak-status', prepSeconds, 'Preparing…', 'Preparation time');
  }

  const status = $('speak-status');
  if (status) status.textContent = 'Recording now!';
  const recInd = $('rec-indicator');
  if (recInd) recInd.style.display = 'inline-flex';

  await startRecording(recordSeconds);
}

async function startRecording(seconds) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      currentRecording = URL.createObjectURL(blob);
      stream.getTracks().forEach(t => t.stop());

      const recInd = $('rec-indicator');
      if (recInd) recInd.style.display = 'none';
      const status = $('speak-status');
      if (status) status.textContent = '✓ Recording complete!';
      const timerEl = $('speak-timer');
      if (timerEl) timerEl.textContent = '0';

      // Mark as answered
      const q = questions[currentIdx];
      answers[q.id] = { recorded: true, blobUrl: currentRecording };
      updateQNavGrid();
    };

    mediaRecorder.start();

    const stopBtn = $('stop-record-btn');
    if (stopBtn) { stopBtn.disabled = false; }

    await runTimer('speak-timer', 'speak-status', seconds, 'Recording…', 'Recording');

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  } catch (e) {
    const status = $('speak-status');
    if (status) status.textContent = 'Microphone access denied. Please allow microphone access and try again.';
    console.error('Recording error:', e);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

function runTimer(timerId, statusId, seconds, statusText, label) {
  return new Promise(resolve => {
    let remaining = seconds;
    const timerEl = $(timerId);
    const statusEl = $(statusId);

    if (statusEl) statusEl.textContent = `${label}: ${remaining}s remaining`;

    const tick = setInterval(() => {
      remaining--;
      if (timerEl) timerEl.textContent = remaining;
      if (statusEl) statusEl.textContent = `${label}: ${remaining}s remaining`;
      if (remaining <= 0) {
        clearInterval(tick);
        resolve();
      }
    }, 1000);

    if (timerId === 'speak-timer') respTimer = tick;
  });
}

/* ── Chart rendering ─────────────────────────────────────────────────────── */
function renderChart(canvas, type, data) {
  try {
    const cfg = {
      bar_chart: { type: 'bar', data, options: { responsive: true, plugins: { legend: { position: 'top' } } } },
      line_graph: { type: 'line', data, options: { responsive: true, plugins: { legend: { position: 'top' } } } },
      pie_chart: { type: 'pie', data: { labels: data.labels, datasets: [{ data: data.data, backgroundColor: ['#3b82f6','#7c3aed','#10b981','#f59e0b','#ef4444'] }] }, options: { responsive: true } },
    };
    const chartCfg = cfg[type];
    if (chartCfg) new Chart(canvas, chartCfg);
  } catch (e) { console.error('Chart error', e); }
}

/* ── Answer collectors ───────────────────────────────────────────────────── */
function collectAnswer(q) {
  const existing = answers[q.id];

  switch (q.type) {
    case 'speaking_read_aloud':
    case 'speaking_repeat_sentence':
    case 'speaking_describe_image':
    case 'speaking_retell_lecture':
    case 'speaking_answer_short':
      return existing || { recorded: false };

    case 'writing_summarize_text':
    case 'writing_essay':
    case 'listening_summarize': {
      const el = $('writing-input');
      return { text: el ? el.value : '' };
    }

    case 'reading_rw_fill_blanks': {
      const selects = document.querySelectorAll('.blank-select');
      const ans = [];
      selects.forEach(s => ans.push({ id: parseInt(s.dataset.blank), word: s.value }));
      return { answers: ans };
    }

    case 'reading_fill_blanks':
    case 'listening_fill_blanks': {
      const inputs = document.querySelectorAll('.blank-input');
      const ans = [];
      inputs.forEach(inp => ans.push({ id: parseInt(inp.dataset.blank), word: inp.value.trim() }));
      return { answers: ans };
    }

    case 'reading_mcma':
    case 'listening_mcma': {
      const checked = document.querySelectorAll('input[type="checkbox"]:checked');
      return { selected: Array.from(checked).map(c => c.value) };
    }

    case 'reading_mcsa':
    case 'listening_highlight_summary':
    case 'listening_mcsa':
    case 'listening_missing_word': {
      const checked = document.querySelector('input[type="radio"]:checked');
      return { selected: checked ? checked.value : null };
    }

    case 'reading_reorder': {
      const items = document.querySelectorAll('#reorder-answer .reorder-item');
      return { order: Array.from(items).map(el => el.dataset.id) };
    }

    case 'listening_highlight_incorrect': {
      const selected = document.querySelectorAll('.hw-word.selected');
      return { selected: Array.from(selected).map(el => el.dataset.word) };
    }

    case 'listening_write_dictation': {
      const el = $('dictation-input');
      return { text: el ? el.value.trim() : '' };
    }

    default:
      return existing || {};
  }
}

/* ── Interaction helpers ─────────────────────────────────────────────────── */
function toggleMCMA(checkbox) {
  const label = checkbox.closest('.mcq-option');
  if (label) label.classList.toggle('selected', checkbox.checked);
  markAnswered();
}

function selectMCSA(id, label) {
  document.querySelectorAll('.mcq-option').forEach(el => el.classList.remove('selected'));
  label.classList.add('selected');
  markAnswered();
}

function toggleHighlight(el) {
  el.classList.toggle('selected');
  markAnswered();
}

function fillBlankFromBank(word, tokenEl) {
  const activeInput = document.querySelector('.blank-input:focus');
  if (activeInput) {
    activeInput.value = word;
    tokenEl.classList.add('used');
    markAnswered();
  }
}

function markAnswered() {
  const q = questions[currentIdx];
  if (!answers[q.id]) {
    answers[q.id] = true; // placeholder until collected on submit
    updateQNavGrid();
  }
}

/* ── Drag & Drop for Reorder ─────────────────────────────────────────────── */
function dragStart(e) {
  reorderDragItem = e.target.closest('.reorder-item');
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => reorderDragItem && reorderDragItem.classList.add('dragging'), 0);
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function dropOnAnswer(e) {
  e.preventDefault();
  const answer = $('reorder-answer');
  if (reorderDragItem && answer) {
    answer.appendChild(reorderDragItem);
    reorderDragItem.classList.remove('dragging');
    reorderDragItem = null;
    markAnswered();
  }
}

function dropOnItem(e) {
  e.preventDefault();
  const target = e.target.closest('.reorder-item');
  if (!target || !reorderDragItem || target === reorderDragItem) return;
  const parent = target.parentElement;
  const targetRect = target.getBoundingClientRect();
  const middle = targetRect.top + targetRect.height / 2;
  if (e.clientY < middle) {
    parent.insertBefore(reorderDragItem, target);
  } else {
    parent.insertBefore(reorderDragItem, target.nextSibling);
  }
  reorderDragItem.classList.remove('dragging');
  reorderDragItem = null;
  markAnswered();
}

/* ── Global Timer ────────────────────────────────────────────────────────── */
function startGlobalTimer() {
  sectionTimer = setInterval(() => {
    timeLeft--;
    const el = $('global-timer');
    if (el) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      el.className = 'test-timer' + (timeLeft < 300 ? (timeLeft < 60 ? ' danger' : ' warning') : '');
    }
    if (timeLeft <= 0) {
      clearInterval(sectionTimer);
      completeTest();
    }
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESULTS PAGE
═══════════════════════════════════════════════════════════════════════════ */
async function showResults(attemptId) {
  render(`<div style="display:flex;align-items:center;justify-content:center;height:100vh"><div class="spinner"></div></div>`);

  try {
    const data = await API(`/api/attempts/${attemptId}/results`);
    const { attempt: att, test: t, answers: ans, summary } = data;
    const sectionScores = att.section_scores || {};

    const pct = att.max_score > 0 ? Math.round(att.total_score / att.max_score * 100) : 0;
    const pteBand = summary.pteBand || 10;

    render(`
    <div style="background:var(--bg);min-height:100vh;padding:32px;max-width:900px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <div class="nav-logo" style="font-size:20px;font-weight:800">PTE<span style="color:var(--blue)">Master</span></div>
        <a href="dashboard.html" class="btn btn-ghost">← Back to Dashboard</a>
      </div>

      <div class="results-hero">
        <div style="font-size:14px;opacity:.8;margin-bottom:8px">${t.title}</div>
        <div class="results-score-big">${pct}%</div>
        <div class="results-score-max">${Math.round(att.total_score)} / ${Math.round(att.max_score)} points</div>
        <div class="pte-band">Estimated PTE Band: ~${pteBand}</div>
        <div style="margin-top:16px;font-size:13px;opacity:.7">
          Completed ${att.completed_at ? new Date(att.completed_at).toLocaleString('en-AU') : '—'}
          ${att.time_spent ? ` · ${Math.round(att.time_spent / 60)} min spent` : ''}
        </div>
      </div>

      <!-- Section Breakdown -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:20px">Section Scores</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px">
          ${Object.entries(sectionScores).map(([sec, { score, max }]) => {
            const sPct = max > 0 ? Math.round(score / max * 100) : 0;
            const colors = { speaking: '#7c3aed', writing: '#f59e0b', reading: '#10b981', listening: '#3b82f6' };
            return `<div style="text-align:center;padding:20px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
              <div style="font-size:32px;font-weight:800;color:${colors[sec] || '#3b82f6'}">${sPct}%</div>
              <div style="font-size:12px;font-weight:700;text-transform:capitalize;color:var(--text-muted);margin-top:4px">${sec}</div>
              <div style="font-size:11px;color:var(--text-muted)">${Math.round(score)}/${Math.round(max)} pts</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Answer Review -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Answer Review</span>
          <span style="font-size:13px;color:var(--text-muted)">${ans.length} questions</span>
        </div>
        ${ans.map((a, i) => renderAnswerReview(a, i)).join('')}
      </div>

      <div style="text-align:center;margin-top:24px;display:flex;gap:12px;justify-content:center">
        <a href="test.html?id=${t.id}" class="btn btn-outline">Retry This Test</a>
        <a href="dashboard.html" class="btn btn-primary">Back to Dashboard</a>
      </div>
    </div>`);
  } catch (e) {
    render(`<div style="text-align:center;padding:60px"><p>${e.error || 'Failed to load results'}</p><a href="dashboard.html" class="btn btn-primary" style="margin-top:16px">Back</a></div>`);
  }
}

function renderAnswerReview(a, i) {
  const pct = a.max_score > 0 ? Math.round(a.score / a.max_score * 100) : 0;
  const status = pct >= 80 ? 'chip-green' : pct >= 50 ? 'chip-amber' : 'chip-red';

  return `
  <div style="border-bottom:1px solid var(--border);padding:16px 0">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
      <div>
        <span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">${formatType(a.type)}</span>
        ${a.title ? `<div style="font-size:13px;color:var(--text-muted)">${a.title}</div>` : ''}
      </div>
      <span class="chip ${status}">${Math.round(a.score)}/${Math.round(a.max_score)} pts · ${pct}%</span>
    </div>
    ${a.feedback ? `<div class="alert alert-info" style="font-size:13px;margin-top:8px">${a.feedback}</div>` : ''}
  </div>`;
}

/* ── DOM helper ──────────────────────────────────────────────────────────── */
function render(html) {
  document.getElementById('test-root').innerHTML = html;
}
