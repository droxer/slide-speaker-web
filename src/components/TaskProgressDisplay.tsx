'use client';

import { useI18n } from '@/i18n/hooks';

type TaskProgressDisplayProps = {
  progress: number;
};

const TaskProgressDisplay = ({ progress }: TaskProgressDisplayProps) => {
  const { t } = useI18n();

  const clampedProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : 0;

  return (
    <div
      className="progress-container"
      role="group"
      aria-label={t('processing.progressLabel', undefined, 'Overall progress')}
    >
      <div className="progress-header">
        <span className="progress-label">
          {t('processing.progressLabel', undefined, 'Overall progress')}
        </span>
        <span className="progress-value">
          {clampedProgress}
          <span className="progress-value__suffix">%</span>
        </span>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedProgress}
      >
        <div
          className="progress-fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <p className="progress-status" aria-live="polite">
        {t(
          'processing.progressStatus',
          undefined,
          'We are bringing your presentation to life…'
        )}
      </p>
    </div>
  );
};

export default TaskProgressDisplay;
