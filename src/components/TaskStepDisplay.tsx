'use client';

import { useI18n } from '@/i18n/hooks';
import {
  STEP_STATUS_ICONS,
  StepStatusVariant,
  normalizeStepStatus,
} from '@/utils/stepLabels';
import { getTaskStatusLabel } from '@/utils/taskStatus';
import { sortSteps } from '@/utils/stepOrdering';

type TaskStepDisplayProps = {
  steps: Record<string, any>;
  voiceLanguage: string;
  subtitleLanguage: string;
  formatStepNameWithLanguages: (
    step: string,
    vl: string,
    sl?: string
  ) => string;
};

const TaskStepDisplay = ({
  steps,
  voiceLanguage,
  subtitleLanguage,
  formatStepNameWithLanguages,
}: TaskStepDisplayProps) => {
  const { t } = useI18n();

  const describeStepStatus = (variant: StepStatusVariant) =>
    getTaskStatusLabel(variant, t);

  const sortedSteps = sortSteps(steps);

  return (
    <div className="steps-grid" role="list">
      {sortedSteps.map(([stepName, stepData]) => {
        if (!stepData) return null;
        const vl = String(voiceLanguage || 'english');
        const sl = String(subtitleLanguage || vl);
        const statusVariant = normalizeStepStatus(stepData.status);
        return (
          <div
            key={stepName}
            role="listitem"
            className={`progress-step progress-step--${statusVariant}`}
          >
            <span className="progress-step__icon" aria-hidden="true">
              {STEP_STATUS_ICONS[statusVariant]}
            </span>
            <div className="progress-step__body">
              <span className="progress-step__title">
                {formatStepNameWithLanguages(stepName, vl, sl)}
              </span>
              <span className="progress-step__meta">
                {describeStepStatus(statusVariant)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskStepDisplay;
