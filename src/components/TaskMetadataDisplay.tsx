'use client';

import { useI18n } from '@/i18n/hooks';

type TaskMetadataDisplayProps = {
  taskId: string | null;
  fileName: string | null;
  processingDetails: any;
};

const TaskMetadataDisplay = ({
  taskId: _taskId,
  fileName,
  processingDetails,
}: TaskMetadataDisplayProps) => {
  const { t } = useI18n();
  const pd = processingDetails || {};

  // Get language information
  const voiceLanguage = String(pd.voice_language || 'english');
  const subtitleLanguage = String(pd.subtitle_language || voiceLanguage);
  const transcriptLanguage =
    pd.transcript_language ??
    (pd as any)?.kwargs?.transcript_language ??
    pd.podcast_transcript_language ??
    null;

  const voiceDisplay = t(
    `language.display.${voiceLanguage.toLowerCase()}`,
    undefined,
    voiceLanguage
  );
  const subtitleDisplay = t(
    `language.display.${subtitleLanguage.toLowerCase()}`,
    undefined,
    subtitleLanguage
  );
  const transcriptDisplay = transcriptLanguage
    ? t(
        `language.display.${String(transcriptLanguage).toLowerCase()}`,
        undefined,
        String(transcriptLanguage)
      )
    : null;

  const parameterItems = [
    {
      key: 'voice-lang',
      label: t('task.detail.voice', undefined, 'Voice'),
      value: voiceDisplay,
    },
    {
      key: 'subtitle-lang',
      label: t('task.detail.subtitles', undefined, 'Subtitles'),
      value: subtitleDisplay,
    },
  ];

  if (transcriptDisplay) {
    parameterItems.push({
      key: 'transcript-lang',
      label: t('task.detail.transcript', undefined, 'Transcript'),
      value: transcriptDisplay,
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
