'use client';

import { useI18n } from '@/i18n/hooks';

type ErrorDisplayProps = {
  errors: any[];
  voiceLanguage: string;
  subtitleLanguage: string;
  formatStepNameWithLanguages: (
    step: string,
    vl: string,
    sl?: string
  ) => string;
};

const ErrorDisplay = ({
  errors,
  voiceLanguage,
  subtitleLanguage,
  formatStepNameWithLanguages,
}: ErrorDisplayProps) => {
  const { t } = useI18n();

  if (!Array.isArray(errors) || errors.length === 0) {
    return null;
  }

  return (
    <div className="error-section">
      <h4>{t('processing.errorsHeading', undefined, 'Errors')}</h4>
      <div className="error-list">
        {errors.slice(0, 3).map((error: any, index: number) => {
          const vl = String(voiceLanguage || 'english');
          const sl = String(subtitleLanguage || vl);
          return (
            <div key={index} className="error-item">
              <strong>
                {formatStepNameWithLanguages(String(error.step), vl, sl)}:
              </strong>{' '}
              {String(error.error)}
            </div>
          );
        })}
        {errors.length > 3 && (
          <div className="error-item">+ {errors.length - 3} more errors...</div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
