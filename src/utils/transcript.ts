import type { PodcastScriptLine } from '@/types';

export type TranscriptCue = {
  start: number;
  end: number;
  text: string;
};

const STRIP_INLINE = /[*_`\->]/g;
const IGNORE_HEADERS = new Set([
  'podcast conversation',
  'podcast conversation:',
]);

const cleanText = (text: string): string =>
  text.replace(STRIP_INLINE, '').trim();

const normalizeParagraphs = (markdown: string): string[] => {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => block.replace(/^#+\s*/, '').trim())
    .filter((text) => {
      const normalized = cleanText(text).toLowerCase();
      return normalized.length > 0 && !IGNORE_HEADERS.has(normalized);
    });
};

export const buildCuesFromMarkdown = (
  markdown: string,
  segmentSeconds = 5
): TranscriptCue[] => {
  const paragraphs = normalizeParagraphs(markdown);

  return paragraphs.map((raw, index) => ({
    start: index * segmentSeconds,
    end: (index + 1) * segmentSeconds,
    text: cleanText(raw).replace(/^\*\*(.+?):\*\*\s*/, '$1: '),
  }));
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

export const buildCuesFromPodcastDialogue = (
  dialogue: PodcastScriptLine[],
  segmentSeconds = 5,
  hostVoice?: string | null,
  guestVoice?: string | null
): TranscriptCue[] => {
  if (!Array.isArray(dialogue) || dialogue.length === 0) return [];

  let fallbackCursor = 0;

  return dialogue
    .map((item) => {
      const rawSpeaker = item.speaker?.trim() || 'Speaker';
      const text = item.text?.trim();

      // Format speaker name with voice information if available
      if (!text) return null;

      const normalizedSpeaker = rawSpeaker.toLowerCase();
      const dialogueVoice =
        typeof item.voice === 'string' && item.voice.trim().length > 0
          ? item.voice.trim()
          : normalizedSpeaker.startsWith('host')
            ? hostVoice?.trim() || null
            : normalizedSpeaker.startsWith('guest')
              ? guestVoice?.trim() || null
              : null;

      let speaker = rawSpeaker;
      if (normalizedSpeaker.startsWith('host')) {
        speaker = dialogueVoice ? `${dialogueVoice} (Host)` : 'Host';
      } else if (normalizedSpeaker.startsWith('guest')) {
        speaker = dialogueVoice ? `${dialogueVoice} (Guest)` : 'Guest';
      } else if (dialogueVoice) {
        speaker = dialogueVoice;
      }

      const explicitStart = asNumber(item.start);
      const explicitEnd = asNumber(item.end);
      const explicitDuration = asNumber(item.duration);

      let start = explicitStart ?? fallbackCursor;
      if (start < 0) start = 0;

      let end: number;
      if (explicitEnd !== null) {
        end = explicitEnd;
      } else if (explicitDuration !== null) {
        end = start + Math.max(explicitDuration, 0);
      } else {
        end = start + segmentSeconds;
      }

      if (!Number.isFinite(end) || end <= start) {
        const fallbackDuration =
          explicitDuration !== null
            ? Math.max(explicitDuration, 0.5)
            : Math.max(
                segmentSeconds,
                Math.max(text.split(/\s+/).length / 2.5, 2)
              );
        end = start + fallbackDuration;
      }

      fallbackCursor = Math.max(fallbackCursor, end);

      return {
        start,
        end,
        text: `${speaker}: ${text}`,
      };
    })
    .filter((cue): cue is TranscriptCue => cue !== null);
};

export default buildCuesFromMarkdown;
