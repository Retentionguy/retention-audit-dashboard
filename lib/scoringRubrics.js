/**
 * PTE Academic scoring rubrics for all question types.
 * Used by the AI scoring engine (lib/prompts.js) to provide accurate rubric context.
 */

const WRITING_RUBRIC = {
  summarize_written: `
Summarize Written Text (SWT) — 1 sentence, 5-75 words:
- Content (0-2): Does it capture the key point? Penalise if main idea is missing.
- Form (0-1): Is it a single grammatically complete sentence within 5-75 words?
- Grammar (0-2): Accurate sentence structure, verb agreement, tense.
- Vocabulary (0-2): Appropriate academic vocabulary, no informal language.
- Spelling (0-2): All words correctly spelled.
Max total: 10 points (converted to PTE score band).`,

  essay: `
Write Essay (WE) — 200-300 words:
- Content (0-3): Does it address the prompt? Are both sides discussed (if required)?
- Form (0-2): Word count 200-300. Organised with intro, body, conclusion.
- Grammar (0-2): Variety of sentence structures, minimal errors.
- Vocabulary (0-2): Sophisticated, varied vocabulary. Collocations accurate.
- Spelling (0-2): All words correctly spelled.
Max total: 15 points.`,

  summarize_spoken: `
Summarize Spoken Text (SST) — 50-70 words:
- Content (0-2): Does it identify main idea and key points from the lecture?
- Form (0-1): Single paragraph, 50-70 words.
- Grammar (0-2): Accurate sentence construction.
- Vocabulary (0-2): Appropriate paraphrase of spoken content.
- Spelling (0-2): Correctly spelled.
Max total: 10 points.`,
};

const SPEAKING_RUBRIC = {
  read_aloud: `
Read Aloud (RA):
- Content (0-5): Coverage of words from the text. Penalise omissions and substitutions.
- Oral Fluency (0-5): Smooth, even delivery. No hesitations, repetitions, or false starts.
  - 5: Native-like rhythm, no pausing within phrases
  - 3: Some unnatural pausing, self-correction
  - 1: Frequent pausing, fragmented delivery
- Pronunciation (0-5): Clear, intelligible sounds. Individual phonemes and word stress correct.
Max total: 15 points → converted to PTE scale.`,

  repeat_sentence: `
Repeat Sentence (RS):
- Content (0-3): How many words from original are included?
- Oral Fluency (0-3): Smoothness of delivery without hesitation.
- Pronunciation (0-3): Clarity of sounds.
Max total: 9 points → PTE scale.`,

  describe_image: `
Describe Image (DI) — 40 seconds:
- Content (0-5): Identifies main trend/relationship. Covers key data points.
- Oral Fluency (0-5): Smooth, well-paced delivery.
- Pronunciation (0-5): Clear and intelligible.
Max total: 15 points.`,

  retell_lecture: `
Re-tell Lecture (RL) — 40 seconds:
- Content (0-5): Key topics from the lecture identified and included.
- Oral Fluency (0-5): Natural, smooth delivery.
- Pronunciation (0-5): Intelligible and accurate.
Max total: 15 points.`,

  answer_short: `
Answer Short Question (ASQ):
- 1 point for correct, specific answer. 0 for incorrect or no answer.`,
};

const READING_RUBRIC = {
  mc_reading_multiple: `
Multiple Choice, Multiple Answer (MCMA — Reading):
- Partial credit: +1 per correct selection, -1 per incorrect selection (minimum 0).`,

  mc_reading_single: `
Multiple Choice, Single Answer (MCSA — Reading):
- 1 point for correct answer, 0 for incorrect.`,

  reorder: `
Re-order Paragraphs (ROP):
- 1 point per correct adjacent pair (n-1 possible pairs for n sentences).`,

  reading_fib: `
Reading: Fill in the Blanks (R-FIB):
- 1 point per correctly filled blank.`,

  rw_fib: `
Reading & Writing: Fill in the Blanks (RW-FIB):
- 1 point per correctly filled blank.
- These blanks count toward both Reading and Writing scores.`,
};

const LISTENING_RUBRIC = {
  summarize_spoken: WRITING_RUBRIC.summarize_spoken,

  mc_listening_multiple: `
Multiple Choice, Multiple Answer (MCMA — Listening):
- +1 per correct selection, -1 per incorrect selection (minimum 0).`,

  listening_fib: `
Listening: Fill in the Blanks (L-FIB):
- 1 point per correctly filled blank (exact word from audio).`,

  highlight_summary: `
Highlight Correct Summary (HCS):
- 1 point for selecting the paragraph that best summarises the recording.`,

  mc_listening_single: `
Multiple Choice, Single Answer (MCSA — Listening):
- 1 point for correct answer.`,

  select_missing: `
Select Missing Word (SMW):
- 1 point for selecting the word/phrase that logically completes the recording.`,

  highlight_incorrect: `
Highlight Incorrect Words (HIW):
- +1 per word correctly identified as different from recording.
- -1 per word incorrectly highlighted (false positive).
- Minimum score: 0.`,

  write_dictation: `
Write from Dictation (WFD):
- 1 point per correctly written word (exact spelling, exact form).
- All words must match the recording exactly.`,
};

// PTE band descriptors (10-90 scale)
const BAND_DESCRIPTORS = {
  79: 'Expert — communicates with precision across all skills',
  65: 'Advanced — handles complex language with minor errors',
  50: 'Competent — generally effective use of English',
  35: 'Intermediate — basic English competence with frequent errors',
  0:  'Beginner — limited English ability',
};

function getBandLabel(score) {
  for (const [threshold, label] of Object.entries(BAND_DESCRIPTORS).sort((a,b)=>b[0]-a[0])) {
    if (score >= parseInt(threshold)) return label;
  }
  return BAND_DESCRIPTORS[0];
}

module.exports = {
  WRITING_RUBRIC,
  SPEAKING_RUBRIC,
  READING_RUBRIC,
  LISTENING_RUBRIC,
  BAND_DESCRIPTORS,
  getBandLabel,
};
