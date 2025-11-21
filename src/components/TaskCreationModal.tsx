import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getLanguageDisplayName } from '../utils/language';
import { useI18n } from '@/i18n/hooks';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getTtsVoices, type TtsVoicesResponse } from '@/services/client';
import TaskTypeIcon from '@/components/TaskTypeIcon';

type RunTaskPayload = {
  task_type: 'video' | 'podcast';
  voice_language: string;
  voice_id?: string | null;
  subtitle_language?: string | null;
  transcript_language?: string | null;
  video_resolution?: string;
  generate_video?: boolean;
  generate_podcast?: boolean;
  podcast_host_voice?: string | null;
  podcast_guest_voice?: string | null;
};

type Props = {
  open: boolean;
  isPdf: boolean;
  defaults: Partial<RunTaskPayload>;
  onClose: () => void;
  onSubmit: (payload: RunTaskPayload) => void;
  filename?: string;
  submitting?: boolean;
};

const LANGS = [
  'english',
  'simplified_chinese',
  'traditional_chinese',
  'japanese',
  'korean',
  'thai',
];

const shortenFileName = (
  name?: string,
  fallback = 'Selected file',
  max = 48
): string => {
  if (!name) return fallback;
  const base = name.replace(/\.(pdf|pptx?|PPTX?|PDF)$/, '');
  if (base.length <= max) return base;
  const head = Math.max(12, Math.floor((max - 1) / 2));
  const tail = max - head - 1;
  return base.slice(0, head) + '…' + base.slice(-tail);
};

const TaskCreationModal = ({
  open,
  isPdf,
  defaults,
  onClose,
  onSubmit,
  filename,
  submitting,
}: Props) => {
  const { t } = useI18n();
  const [taskType, setTaskType] = useState<'video' | 'podcast'>(
    (defaults.task_type as any) || 'video'
  );
  const [voiceLang, setVoiceLang] = useState<string>(
    defaults.voice_language || 'english'
  );
  const [subLang, setSubLang] = useState<string | null>(
    (defaults.subtitle_language as any) ?? null
  );
  const [transcriptLang, setTranscriptLang] = useState<string | null>(
    (defaults.transcript_language as any) ?? null
  );
  const [resolution, setResolution] = useState<string>(
    defaults.video_resolution || 'hd'
  );
  const [voiceId, setVoiceId] = useState<string>(
    (defaults.voice_id as string | null) ?? ''
  );
  const [hostVoice, setHostVoice] = useState<string>(
    (defaults.podcast_host_voice as string | null) ?? ''
  );
  const [guestVoice, setGuestVoice] = useState<string>(
    (defaults.podcast_guest_voice as string | null) ?? ''
  );

  const isPodcast = isPdf && taskType === 'podcast';

  const voiceQuery = useQuery<TtsVoicesResponse>({
    queryKey: ['ttsVoices', voiceLang],
    queryFn: () => getTtsVoices(voiceLang),
    enabled: open && Boolean(voiceLang),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  const availableVoices = useMemo(() => {
    const voices = voiceQuery.data?.voices ?? [];
    return voices.filter(
      (voice) => typeof voice === 'string' && voice.trim().length > 0
    );
  }, [voiceQuery.data?.voices]);

  const voiceOptionsLoading = voiceQuery.isFetching;
  const voiceOptionsError = voiceQuery.isError;
  const hasVoiceOptions = availableVoices.length > 0;

  const voicePlaceholder = voiceOptionsLoading
    ? t('upload.voice.loading', undefined, 'Loading voices…')
    : voiceOptionsError
      ? t(
          'upload.voice.error',
          undefined,
          'Voices unavailable - defaults will be used.'
        )
      : t(
          'upload.voice.none',
          undefined,
          'No voices available for this language'
        );

  const formatVoiceLabel = useCallback((voice: string) => {
    return (
      voice
        .split(/[_\s]+/)
        .map((part) => (part ? part[0]?.toUpperCase() + part.slice(1) : ''))
        .join(' ')
        .trim() || voice
    );
  }, []);

  const taskTypeLabel =
    taskType === 'podcast'
      ? t('task.list.podcastLabel', undefined, 'Podcast')
      : t('task.list.videoLabel', undefined, 'Video');

  // Use focus trap for the modal
  const modalRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    setTaskType(isPdf ? (defaults.task_type as any) || 'video' : 'video');
    setVoiceLang(defaults.voice_language || 'english');
    setSubLang((defaults.subtitle_language as any) ?? null);
    setTranscriptLang((defaults.transcript_language as any) ?? null);
    setResolution(defaults.video_resolution || 'hd');
    setVoiceId((defaults.voice_id as string | null) ?? '');
    setHostVoice((defaults.podcast_host_voice as string | null) ?? '');
    setGuestVoice((defaults.podcast_guest_voice as string | null) ?? '');
    // no avatar config in upload view; keep defaults as-is (not exposed)
  }, [
    open,
    isPdf,
    defaults.task_type,
    defaults.voice_language,
    defaults.subtitle_language,
    defaults.transcript_language,
    defaults.voice_id,
    defaults.podcast_host_voice,
    defaults.podcast_guest_voice,
    defaults.video_resolution,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!hasVoiceOptions) {
      if (voiceId) setVoiceId('');
      return;
    }

    const defaultVoice =
      typeof defaults.voice_id === 'string' &&
      availableVoices.includes(defaults.voice_id)
        ? defaults.voice_id
        : null;

    if (!availableVoices.includes(voiceId)) {
      setVoiceId(defaultVoice || availableVoices[0]);
    }
  }, [availableVoices, defaults.voice_id, hasVoiceOptions, open, voiceId]);

  useEffect(() => {
    if (!open || !isPodcast) {
      if (hostVoice) setHostVoice('');
      if (guestVoice) setGuestVoice('');
      return;
    }
    if (!hasVoiceOptions) {
      if (hostVoice) setHostVoice('');
      if (guestVoice) setGuestVoice('');
      return;
    }

    const defaultHost =
      typeof defaults.podcast_host_voice === 'string' &&
      availableVoices.includes(defaults.podcast_host_voice)
        ? defaults.podcast_host_voice
        : null;
    const normalizedVoiceId =
      typeof voiceId === 'string' && availableVoices.includes(voiceId)
        ? voiceId
        : null;

    const resolvedHost =
      (hostVoice && availableVoices.includes(hostVoice)
        ? hostVoice
        : defaultHost) ||
      normalizedVoiceId ||
      availableVoices[0];

    if (hostVoice !== resolvedHost) {
      setHostVoice(resolvedHost);
    }

    const defaultGuest =
      typeof defaults.podcast_guest_voice === 'string' &&
      availableVoices.includes(defaults.podcast_guest_voice)
        ? defaults.podcast_guest_voice
        : null;

    const resolvedGuest =
      guestVoice &&
      availableVoices.includes(guestVoice) &&
      guestVoice !== resolvedHost
        ? guestVoice
        : defaultGuest && defaultGuest !== resolvedHost
          ? defaultGuest
          : normalizedVoiceId && normalizedVoiceId !== resolvedHost
            ? normalizedVoiceId
            : availableVoices.find((voice) => voice !== resolvedHost) ||
              resolvedHost;

    if (guestVoice !== resolvedGuest) {
      setGuestVoice(resolvedGuest);
    }
  }, [
    availableVoices,
    defaults.podcast_host_voice,
    defaults.podcast_guest_voice,
    guestVoice,
    hasVoiceOptions,
    hostVoice,
    isPodcast,
    open,
    voiceId,
  ]);

  // Close on ESC and lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e as any).keyCode === 27) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const fileDisplayName = shortenFileName(
    filename,
    t('runTask.noFileSelected', undefined, 'Selected file')
  );

  const displayLanguage = (code: string) => {
    const normalized = (code || '').toLowerCase();
    const fallback = getLanguageDisplayName(code);
    return t(
      `language.display.${normalized}`,
      undefined,
      fallback || t('common.unknown', undefined, 'Unknown')
    );
  };

  const run = () => {
    // Upload view parity:
    // - PDF supports either video or podcast
    // - Slides support video only
    const chosenType: 'video' | 'podcast' = isPdf ? taskType : 'video';
    const payload: RunTaskPayload = {
      task_type: chosenType,
      voice_language: voiceLang,
      subtitle_language: chosenType === 'podcast' ? null : (subLang ?? null),
      transcript_language:
        chosenType === 'podcast' ? (transcriptLang ?? null) : null,
      generate_video: chosenType !== 'podcast',
      generate_podcast: chosenType !== 'video',
    } as RunTaskPayload;

    payload.voice_id =
      chosenType === 'podcast'
        ? null
        : voiceId && voiceId.trim().length > 0
          ? voiceId
          : null;
    payload.podcast_host_voice =
      chosenType === 'podcast' && hasVoiceOptions && hostVoice
        ? hostVoice
        : null;
    payload.podcast_guest_voice =
      chosenType === 'podcast' && hasVoiceOptions && guestVoice
        ? guestVoice
        : null;

    // Only include video_resolution for video tasks
    if (chosenType === 'video') {
      payload.video_resolution = resolution;
    }

    onSubmit(payload);
  };

  return (
    <div
      className="run-task-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="run-task-modal__content"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="run-task-modal__header-bar" data-kind={taskType}>
          <div className="run-task-modal__header-left">
            <span className="run-task-modal__type-chip">
              <TaskTypeIcon
                typeKey={taskType}
                label={taskTypeLabel}
                size="sm"
              />
              <span className="run-task-modal__type-label">
                {taskTypeLabel}
              </span>
            </span>
            <span className="run-task-modal__header-text">
              {taskType === 'podcast'
                ? t('actions.generatePodcast')
                : t('actions.generateVideo')}
              <span
                className="run-task-modal__header-filename"
                title={filename || ''}
              >
                {' '}
                &#183; {fileDisplayName}
              </span>
            </span>
          </div>
          <div className="run-task-modal__header-right">
            <button
              type="button"
              className="run-task-modal__close-btn"
              aria-label={t('actions.close')}
              title={t('actions.close')}
              onClick={onClose}
            >
              <span className="run-task-modal__close-icon" aria-hidden="true">
                ×
              </span>
            </button>
          </div>
        </div>

        <div className="run-task-modal__body">
          <div className="run-task-modal__config">
            <div className="run-task-modal__config-grid">
              <label className="run-task-modal__field">
                <span className="run-task-modal__label">
                  {t('runTask.voiceLanguage')}
                </span>
                <select
                  className="run-task-modal__select"
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  disabled={submitting}
                >
                  {LANGS.map((l) => (
                    <option key={l} value={l}>
                      {displayLanguage(l)}
                    </option>
                  ))}
                </select>
              </label>

              {!isPodcast && (
                <label className="run-task-modal__field">
                  <span className="run-task-modal__label">
                    {t('runTask.voiceSelection', undefined, 'Voice')}
                  </span>
                  <select
                    className="run-task-modal__select"
                    value={hasVoiceOptions ? voiceId : ''}
                    onChange={(e) => setVoiceId(e.target.value)}
                    disabled={submitting || !hasVoiceOptions}
                  >
                    {hasVoiceOptions ? (
                      availableVoices.map((voice) => (
                        <option key={voice} value={voice}>
                          {formatVoiceLabel(voice)}
                        </option>
                      ))
                    ) : (
                      <option value="">{voicePlaceholder}</option>
                    )}
                  </select>
                </label>
              )}

              {!isPodcast && (
                <label className="run-task-modal__field">
                  <span className="run-task-modal__label">
                    {t('runTask.subtitleLanguage')}
                  </span>
                  <select
                    className="run-task-modal__select"
                    value={subLang ?? ''}
                    onChange={(e) => setSubLang(e.target.value || null)}
                    disabled={submitting}
                  >
                    <option value="">{t('runTask.sameAsVoice')}</option>
                    {LANGS.map((l) => (
                      <option key={l} value={l}>
                        {displayLanguage(l)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {isPodcast && (
                <label className="run-task-modal__field">
                  <span className="run-task-modal__label">
                    {t('runTask.transcriptLanguage')}
                  </span>
                  <select
                    className="run-task-modal__select"
                    value={transcriptLang ?? ''}
                    onChange={(e) => setTranscriptLang(e.target.value || null)}
                    disabled={submitting}
                  >
                    <option value="">{t('runTask.sameAsVoice')}</option>
                    {LANGS.map((l) => (
                      <option key={l} value={l}>
                        {displayLanguage(l)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {taskType === 'podcast' && (
                <>
                  <label className="run-task-modal__field">
                    <span className="run-task-modal__label">
                      {t('runTask.hostVoice', undefined, 'Host voice')}
                    </span>
                    <select
                      className="run-task-modal__select"
                      value={hasVoiceOptions ? hostVoice : ''}
                      onChange={(e) => setHostVoice(e.target.value)}
                      disabled={!hasVoiceOptions || submitting}
                    >
                      {hasVoiceOptions ? (
                        availableVoices.map((voice) => (
                          <option key={`host-${voice}`} value={voice}>
                            {formatVoiceLabel(voice)}
                          </option>
                        ))
                      ) : (
                        <option value="">{voicePlaceholder}</option>
                      )}
                    </select>
                  </label>
                  <label className="run-task-modal__field">
                    <span className="run-task-modal__label">
                      {t('runTask.guestVoice', undefined, 'Guest voice')}
                    </span>
                    <select
                      className="run-task-modal__select"
                      value={hasVoiceOptions ? guestVoice : ''}
                      onChange={(e) => setGuestVoice(e.target.value)}
                      disabled={!hasVoiceOptions || submitting}
                    >
                      {hasVoiceOptions ? (
                        availableVoices.map((voice) => (
                          <option key={`guest-${voice}`} value={voice}>
                            {formatVoiceLabel(voice)}
                          </option>
                        ))
                      ) : (
                        <option value="">{voicePlaceholder}</option>
                      )}
                    </select>
                  </label>
                </>
              )}

              {!isPodcast && (
                <label className="run-task-modal__field">
                  <span className="run-task-modal__label">
                    {t('runTask.videoResolution')}
                  </span>
                  <select
                    className="run-task-modal__select"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="sd">{t('runTask.resolution.sd')}</option>
                    <option value="hd">{t('runTask.resolution.hd')}</option>
                    <option value="fullhd">
                      {t('runTask.resolution.fullhd')}
                    </option>
                  </select>
                </label>
              )}
            </div>

            <div className="run-task-modal__actions">
              <button
                type="button"
                className="run-task-modal__btn secondary"
                onClick={onClose}
                disabled={submitting}
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                className="run-task-modal__btn primary"
                onClick={run}
                disabled={submitting}
              >
                {submitting ? t('actions.generating') : t('actions.generate')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCreationModal;
