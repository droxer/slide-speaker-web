'use client';

import { useI18n } from '@/i18n/hooks';

type TaskMetadataDisplayProps = {
  taskId: string | null;
  fileName: string | null;
  processingDetails: unknown;
};

type AnyRecord = Record<string, unknown>;

const isObject = (value: unknown): value is AnyRecord =>
  Boolean(value) && typeof value === 'object';

const pickString = (...candidates: unknown[]): string | null => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
};

const getNested = (root: AnyRecord, path: string[]): unknown => {
  let cursor: unknown = root;
  for (const segment of path) {
    if (!isObject(cursor)) {
      return undefined;
    }
    cursor = cursor[segment];
  }
  return cursor;
};

const coerceBoolean = (...values: unknown[]): boolean | undefined => {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
  }
  return undefined;
};

const TaskMetadataDisplay = ({
  taskId: _taskId,
  fileName: _fileName,
  processingDetails,
}: TaskMetadataDisplayProps) => {
  const { t } = useI18n();

  const pd: AnyRecord = isObject(processingDetails)
    ? (processingDetails as AnyRecord)
    : {};

  const voiceLanguage =
    pickString(
      pd.voice_language,
      getNested(pd, ['kwargs', 'voice_language']),
      getNested(pd, ['task_kwargs', 'voice_language']),
      getNested(pd, ['task_config', 'voice_language']),
      getNested(pd, ['config', 'voice_language']),
      getNested(pd, ['settings', 'voice_language'])
    ) ?? 'english';

  const subtitleLanguage =
    pickString(
      pd.subtitle_language,
      getNested(pd, ['kwargs', 'subtitle_language']),
      getNested(pd, ['task_kwargs', 'subtitle_language']),
      getNested(pd, ['task_config', 'subtitle_language']),
      getNested(pd, ['config', 'subtitle_language']),
      getNested(pd, ['settings', 'subtitle_language'])
    ) ?? voiceLanguage;

  const transcriptLanguage =
    pickString(
      pd.transcript_language,
      pd.podcast_transcript_language,
      getNested(pd, ['kwargs', 'transcript_language']),
      getNested(pd, ['task_kwargs', 'transcript_language']),
      getNested(pd, ['task_config', 'transcript_language']),
      getNested(pd, ['config', 'transcript_language'])
    ) ?? null;

  const primaryVoiceId = pickString(
    pd.voice_id,
    getNested(pd, ['kwargs', 'voice_id']),
    getNested(pd, ['task_kwargs', 'voice_id']),
    getNested(pd, ['task_config', 'voice_id']),
    getNested(pd, ['config', 'voice_id']),
    getNested(pd, ['settings', 'voice_id']),
    getNested(pd, ['steps', 'generate_audio', 'result', 'voice_id'])
  );

  const hostVoice = pickString(
    pd.podcast_host_voice,
    getNested(pd, ['kwargs', 'podcast_host_voice']),
    getNested(pd, ['task_kwargs', 'podcast_host_voice']),
    getNested(pd, ['task_config', 'podcast_host_voice']),
    getNested(pd, ['config', 'podcast_host_voice'])
  );

  const guestVoice = pickString(
    pd.podcast_guest_voice,
    getNested(pd, ['kwargs', 'podcast_guest_voice']),
    getNested(pd, ['task_kwargs', 'podcast_guest_voice']),
    getNested(pd, ['task_config', 'podcast_guest_voice']),
    getNested(pd, ['config', 'podcast_guest_voice'])
  );

  const taskType = (
    pickString(
      pd.task_type,
      getNested(pd, ['kwargs', 'task_type']),
      getNested(pd, ['task_config', 'task_type']),
      getNested(pd, ['task_kwargs', 'task_type'])
    ) || ''
  )
    .toLowerCase()
    .trim();

  const videoEnabled =
    coerceBoolean(
      pd.generate_video,
      getNested(pd, ['kwargs', 'generate_video']),
      getNested(pd, ['task_kwargs', 'generate_video']),
      getNested(pd, ['task_config', 'generate_video']),
      getNested(pd, ['config', 'generate_video']),
      getNested(pd, ['settings', 'generate_video'])
    ) ?? ['video', 'both'].includes(taskType);

  const podcastEnabled =
    coerceBoolean(
      pd.generate_podcast,
      getNested(pd, ['kwargs', 'generate_podcast']),
      getNested(pd, ['task_kwargs', 'generate_podcast']),
      getNested(pd, ['task_config', 'generate_podcast']),
      getNested(pd, ['config', 'generate_podcast']),
      getNested(pd, ['settings', 'generate_podcast'])
    ) ?? ['podcast', 'both'].includes(taskType);

  const podcastOnly = podcastEnabled && !videoEnabled && taskType !== 'both';
  const resolvedVoiceId = podcastOnly ? null : primaryVoiceId;

  const labelForLanguage = (code: string | null): string | null => {
    if (!code) return null;
    const normalized = code.toLowerCase();
    return t(`language.display.${normalized}`, undefined, code);
  };

  const voiceDisplay = labelForLanguage(voiceLanguage) ?? voiceLanguage;
  const subtitleDisplay =
    labelForLanguage(subtitleLanguage) ?? subtitleLanguage;
  const transcriptDisplay =
    labelForLanguage(transcriptLanguage) ?? transcriptLanguage;

  const parameterItems: Array<{
    key: string;
    label: string;
    value: string | null;
  }> = [];

  const voiceValue =
    resolvedVoiceId && resolvedVoiceId.length > 0
      ? `${voiceDisplay} · ${resolvedVoiceId}`
      : voiceDisplay;
  parameterItems.push({
    key: 'voice-lang',
    label: t('task.detail.voice', undefined, 'Voice'),
    value: voiceValue,
  });

  if (videoEnabled) {
    parameterItems.push({
      key: 'subtitle-lang',
      label: t('task.detail.subtitles', undefined, 'Subtitles'),
      value: subtitleDisplay,
    });
  }

  if (podcastEnabled) {
    parameterItems.push({
      key: 'transcript-lang',
      label: t('task.detail.transcript', undefined, 'Transcript'),
      value: transcriptDisplay ?? 'N/A',
    });
  }

  if (podcastEnabled && hostVoice) {
    parameterItems.push({
      key: 'podcast-host-voice',
      label: t('task.detail.podcastHostVoice', undefined, 'Host Voice'),
      value: hostVoice,
    });
  }

  if (podcastEnabled && guestVoice) {
    parameterItems.push({
      key: 'podcast-guest-voice',
      label: t('task.detail.podcastGuestVoice', undefined, 'Guest Voice'),
      value: guestVoice,
    });
  }

  return (
    <div
      className="processing-summary"
      role="group"
      aria-label={t('processing.meta.aria', undefined, 'Task details')}
    >
      {parameterItems.length > 0 && (
        <ul className="processing-summary__tags">
          {parameterItems.map(({ key, label, value }) => (
            <li key={key} className="processing-summary__tag">
              <span className="processing-summary__tag-label">{label}</span>
              <span className="processing-summary__tag-value">{value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskMetadataDisplay;
