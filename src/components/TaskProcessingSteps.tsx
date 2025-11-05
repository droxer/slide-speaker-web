'use client';

import { useMemo } from 'react';
import { useI18n } from '@/i18n/hooks';
import { resolveTaskType } from '@/utils/taskType';
import TaskMetadataDisplay from '@/components/TaskMetadataDisplay';
import TaskProgressDisplay from '@/components/TaskProgressDisplay';
import TaskStepDisplay from '@/components/TaskStepDisplay';
import TaskErrorDisplay from '@/components/TaskErrorDisplay';
import { normalizeStepStatus } from '@/utils/stepLabels';
import { sortSteps } from '@/utils/stepOrdering';

type TaskProcessingStepsProps = {
  taskId: string | null;
  uploadId: string | null;
  fileName: string | null;
  progress: number;
  onStop: () => void;
  processingDetails: any;
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
  progress,
  onStop,
  processingDetails,
  onRetryFromStep,
  isRetrying,
  formatStepNameWithLanguages,
}: TaskProcessingStepsProps) => {
  const { t } = useI18n();
  const pd = processingDetails || {};
  const steps = (pd.steps || {}) as Record<string, any>;

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
    const orderedSteps = sortSteps(steps);
    const errors = Array.isArray(pd.errors) ? pd.errors : [];
    let failureStep: string | null = null;

    for (let idx = errors.length - 1; idx >= 0; idx -= 1) {
      const candidate = errors[idx]?.step;
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
      stepsForDisplay: failureStep ? patched : steps,
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
          <TaskProgressDisplay progress={progress} />
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
                  {t('task.list.videoLabel')}
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
                  {t('task.list.podcastLabel')}
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
              errors={pd.errors}
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
            processingDetails={processingDetails}
          />
        </div>
      </div>
    </section>
  );
};

export default TaskProcessingSteps;
