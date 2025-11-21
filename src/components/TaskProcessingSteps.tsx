'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n/hooks';
import { resolveTaskType } from '@/utils/taskType';
import TaskMetadataDisplay from '@/components/TaskMetadataDisplay';
import TaskProgressDisplay from '@/components/TaskProgressDisplay';
import TaskStepDisplay from '@/components/TaskStepDisplay';
import TaskErrorDisplay from '@/components/TaskErrorDisplay';
import TaskTypeIcon from '@/components/TaskTypeIcon';
import { normalizeStepStatus } from '@/utils/stepLabels';
import { sortSteps } from '@/utils/stepOrdering';
import { getTaskProgress, type TaskProgressResponse } from '@/services/client';

type TaskProcessingStepsProps = {
  taskId: string | null;
  uploadId: string | null;
  fileName: string | null;
  progress?: number;
  onStop: () => void;
  processingDetails?: Partial<TaskProgressResponse> | null;
  onRetryFromStep?: (step: string) => void;
  isRetrying?: boolean;
  formatStepNameWithLanguages: (
    step: string,
    vl: string,
    sl?: string
  ) => string;
};

const TaskProcessingSteps = ({
  taskId,
  uploadId,
  fileName,
  progress = 0,
  onStop,
  processingDetails,
  onRetryFromStep,
  isRetrying,
  formatStepNameWithLanguages,
}: TaskProcessingStepsProps) => {
  const { t } = useI18n();
  const { data: liveDetails } = useQuery<
    TaskProgressResponse,
    Error,
    CompactProgressPayload
  >({
    queryKey: ['progress', taskId],
    queryFn: () => getTaskProgress(taskId as string, { view: 'compact' }),
    enabled: Boolean(taskId),
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    select: (data) => toCompactProgressPayload(data),
  });

  const pd = useMemo(
    () => toCompactProgressPayload(liveDetails ?? processingDetails),
    [liveDetails, processingDetails]
  );
  const steps = pd.steps;

  const normalizeProgress = (value: number | undefined | null) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }
    if (value > 1) {
      return Math.min(100, value);
    }
    return Math.min(100, Math.round(value * 100));
  };

  const progressValue = normalizeProgress(liveDetails?.progress ?? progress);

  const typeInfo = resolveTaskType(
    { task_type: pd.task_type, kwargs: (pd as any)?.kwargs || {} } as any,
    pd as any
  );
  const taskTypeKey = typeInfo.key || 'unknown';

  const voiceLanguage = String(pd.voice_language || 'english');
  const subtitleLanguage = String(pd.subtitle_language || voiceLanguage);

  const uploadIdShort = uploadId
    ? `${uploadId.slice(0, 6)}…${uploadId.slice(-4)}`
    : null;

  const { stepsForDisplay, latestFailedStep } = useMemo(() => {
    const filteredEntries = Object.entries(steps || {}).filter(
      ([stepName, stepData]) =>
        stepName !== 'revise_transcripts' &&
        normalizeStepStatus(stepData?.status) !== 'skipped'
    );

    const filteredSteps = Object.fromEntries(filteredEntries);
    const orderedSteps = sortSteps(filteredSteps);
    const errors = Array.isArray(pd.errors) ? pd.errors : [];
    let failureStep: string | null = null;

    for (let idx = errors.length - 1; idx >= 0; idx -= 1) {
      const candidate =
        errors[idx] && typeof errors[idx] === 'object'
          ? (errors[idx] as any)?.step
          : undefined;
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        failureStep = candidate;
        break;
      }
    }

    let encounteredFailure = false;
    const patched: Record<string, any> = {};

    orderedSteps.forEach(([stepName, stepData]) => {
      const data =
        stepData && typeof stepData === 'object' ? { ...stepData } : {};
      const statusVariant = normalizeStepStatus(stepData?.status);

      if (!encounteredFailure && statusVariant === 'failed') {
        failureStep = stepName;
        encounteredFailure = true;
      }

      if (
        !encounteredFailure &&
        failureStep &&
        failureStep === stepName &&
        statusVariant !== 'failed'
      ) {
        data.status = 'failed';
        encounteredFailure = true;
      } else if (encounteredFailure && stepName !== failureStep) {
        const normalizedNextStatus = normalizeStepStatus(data.status);
        if (normalizedNextStatus !== 'failed') {
          if (
            normalizedNextStatus === 'processing' ||
            normalizedNextStatus === 'completed'
          ) {
            data.status = 'pending';
          } else if (!data.status) {
            data.status = 'pending';
          }
        }
        data.blockedByFailure = true;
      }

      patched[stepName] = data;
    });

    return {
      stepsForDisplay: patched,
      latestFailedStep: failureStep,
    };
  }, [pd.errors, steps]);

  const failureStepLabel =
    latestFailedStep &&
    formatStepNameWithLanguages(
      latestFailedStep,
      voiceLanguage,
      subtitleLanguage
    );

  const fileHint =
    !fileName && uploadIdShort
      ? t(
          'processing.meta.locatingHint',
          { id: uploadIdShort },
          `from file ${uploadIdShort}`
        )
      : undefined;

  return (
    <section className="processing-view" role="status" aria-live="polite">
      <div className="processing-panel">
        <header className="processing-header">
          <div className="processing-header__info">
            <span className="processing-badge">
              <span className="processing-badge__pulse" aria-hidden="true" />
              {t('processing.title')}
            </span>
            {fileHint && (
              <span className="processing-header__hint">{fileHint}</span>
            )}
          </div>

          <button type="button" onClick={onStop} className="processing-action">
            {t('processing.stop')}
          </button>
        </header>
        <div className="processing-progress">
          <TaskProgressDisplay progress={progressValue} />
        </div>

        <div className="processing-steps">
          <div className="processing-steps__header">
            <h3 className="processing-steps__title">
              {t('processing.stepsHeading', undefined, 'Processing steps')}
            </h3>
            <div className="processing-steps__badges">
              {['video', 'both'].includes(taskTypeKey) && (
                <span
                  className="processing-steps__pill processing-steps__pill--video"
                  title={t(
                    'processing.preview.videoEnabled',
                    undefined,
                    'Video generation enabled'
                  )}
                >
                  <TaskTypeIcon
                    typeKey="video"
                    label={t(
                      'processing.preview.videoEnabled',
                      undefined,
                      'Video generation enabled'
                    )}
                    size="sm"
                  />
                </span>
              )}
              {['podcast', 'both'].includes(taskTypeKey) && (
                <span
                  className="processing-steps__pill processing-steps__pill--podcast"
                  title={t(
                    'processing.preview.podcastEnabled',
                    undefined,
                    'Podcast generation enabled'
                  )}
                >
                  <TaskTypeIcon
                    typeKey="podcast"
                    label={t(
                      'processing.preview.podcastEnabled',
                      undefined,
                      'Podcast generation enabled'
                    )}
                    size="sm"
                  />
                </span>
              )}
            </div>
          </div>

          <div className="processing-steps__body">
            <TaskStepDisplay
              steps={stepsForDisplay}
              voiceLanguage={voiceLanguage}
              subtitleLanguage={subtitleLanguage}
              formatStepNameWithLanguages={formatStepNameWithLanguages}
            />

            <TaskErrorDisplay
              errors={Array.isArray(pd.errors) ? pd.errors : []}
              voiceLanguage={voiceLanguage}
              subtitleLanguage={subtitleLanguage}
              formatStepNameWithLanguages={formatStepNameWithLanguages}
            />

            {latestFailedStep && (
              <div className="processing-steps__halt">
                <p className="processing-steps__halt-message">
                  {failureStepLabel
                    ? t(
                        'processing.haltAfterStep',
                        { step: failureStepLabel },
                        `Processing stopped after ${failureStepLabel}.`
                      )
                    : t(
                        'processing.haltGeneric',
                        undefined,
                        'Processing stopped after a failed step.'
                      )}
                </p>
                {onRetryFromStep && (
                  <button
                    type="button"
                    className="processing-action"
                    disabled={Boolean(isRetrying)}
                    aria-busy={Boolean(isRetrying)}
                    onClick={() => {
                      if (!isRetrying) {
                        onRetryFromStep(latestFailedStep);
                      }
                    }}
                  >
                    {isRetrying
                      ? t('processing.retrying', undefined, 'Retrying…')
                      : t('processing.retry', undefined, 'Retry')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="processing-meta">
          <TaskMetadataDisplay
            taskId={taskId}
            fileName={fileName}
            processingDetails={pd}
          />
        </div>
      </div>
    </section>
  );
};

export default TaskProcessingSteps;

type CompactProgressPayload = {
  status: string;
  progress: number;
  current_step: string;
  steps: Record<string, { status?: string; blockedByFailure?: boolean }>;
  errors?: unknown[];
  filename?: string | null;
  file_ext?: string | null;
  source_type?: string | null;
  voice_language?: string | null;
  subtitle_language?: string | null;
  transcript_language?: string | null;
  podcast_transcript_language?: string | null;
  generate_podcast?: boolean;
  generate_video?: boolean;
  generate_subtitles?: boolean;
  generate_avatar?: boolean;
  task_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  voice_id?: string | null;
  podcast_host_voice?: string | null;
  podcast_guest_voice?: string | null;
  message?: string | null;
  kwargs?: Record<string, unknown> | undefined;
  task_kwargs?: Record<string, unknown> | undefined;
  task_config?: Record<string, unknown> | undefined;
  settings?: Record<string, unknown> | undefined;
};

const RELEVANT_NESTED_KEYS = [
  'voice_language',
  'subtitle_language',
  'transcript_language',
  'podcast_transcript_language',
  'voice_id',
  'podcast_host_voice',
  'podcast_guest_voice',
  'generate_podcast',
  'generate_video',
  'generate_subtitles',
  'generate_avatar',
] as const;

const pickRelevant = (value: unknown) => {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Record<string, unknown>;
  const entries = RELEVANT_NESTED_KEYS.map((key) => [key, source[key]]).filter(
    ([, v]) => v !== undefined
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
};

const toCompactProgressPayload = (
  payload:
    | Partial<TaskProgressResponse>
    | CompactProgressPayload
    | null
    | undefined
): CompactProgressPayload => {
  // If payload is already a CompactProgressPayload, return it as-is
  if (
    payload &&
    typeof payload === 'object' &&
    'steps' in payload &&
    typeof (payload as CompactProgressPayload).steps === 'object'
  ) {
    return payload as CompactProgressPayload;
  }

  const safe = typeof payload === 'object' && payload ? payload : {};
  const steps = Object.entries(
    (safe.steps && typeof safe.steps === 'object' ? safe.steps : {}) as Record<
      string,
      any
    >
  ).reduce<Record<string, { status?: string; blockedByFailure?: boolean }>>(
    (acc, [stepName, stepData]) => {
      if (!stepData || typeof stepData !== 'object') {
        acc[stepName] = {};
        return acc;
      }
      const status =
        typeof (stepData as any).status === 'string'
          ? String((stepData as any).status)
          : undefined;
      const blockedByFailure = Boolean((stepData as any).blockedByFailure);
      const compact: { status?: string; blockedByFailure?: boolean } = {};
      if (status) compact.status = status;
      if (blockedByFailure) compact.blockedByFailure = true;
      acc[stepName] = compact;
      return acc;
    },
    {}
  );

  const coerceString = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const coerceNumber = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
    return value;
  };

  const coerceBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return undefined;
  };

  const compactPayload: CompactProgressPayload = {
    status: coerceString(safe.status) ?? 'unknown',
    progress: coerceNumber(safe.progress),
    current_step: coerceString(safe.current_step) ?? 'unknown',
    steps,
    errors: Array.isArray(safe.errors) ? safe.errors : [],
    filename: coerceString(safe.filename),
    file_ext: coerceString(safe.file_ext),
    source_type: coerceString(safe.source_type),
    voice_language: coerceString(safe.voice_language),
    subtitle_language: coerceString(safe.subtitle_language),
    transcript_language: coerceString(
      (safe as any).transcript_language ??
        (safe as any)?.kwargs?.transcript_language
    ),
    podcast_transcript_language: coerceString(
      (safe as any).podcast_transcript_language ??
        (safe as any)?.kwargs?.podcast_transcript_language
    ),
    generate_podcast: coerceBoolean(safe.generate_podcast),
    generate_video: coerceBoolean(safe.generate_video),
    generate_subtitles: coerceBoolean((safe as any).generate_subtitles),
    generate_avatar: coerceBoolean((safe as any).generate_avatar),
    task_type: coerceString(safe.task_type),
    created_at: coerceString(safe.created_at),
    updated_at: coerceString(safe.updated_at),
    voice_id: coerceString((safe as any).voice_id),
    podcast_host_voice: coerceString((safe as any).podcast_host_voice),
    podcast_guest_voice: coerceString((safe as any).podcast_guest_voice),
    message: coerceString((safe as any).message),
    kwargs: pickRelevant((safe as any).kwargs),
    task_kwargs: pickRelevant((safe as any).task_kwargs),
    task_config: pickRelevant((safe as any).task_config),
    settings: pickRelevant((safe as any).settings),
  };

  return compactPayload;
};
