'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import TaskProcessingSteps from './TaskProcessingSteps';
import type { Task } from '@/types';
import type { ProcessingDetails } from './types';
import { getStepLabel } from '@/utils/stepLabels';
import { useI18n } from '@/i18n/hooks';
import { sortSteps } from '@/utils/stepOrdering';
import { useTaskQuery, prefetchTaskDetail } from '@/services/queries';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retryTask } from '@/services/client';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

type TaskProgressModalProps = {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onCancel: (taskId: string) => void | Promise<void>;
};

const formatStepName = (
  step: string,
  voiceLang: string,
  subtitleLang: string | undefined,
  t: (
    key: string,
    vars?: Record<string, string | number>,
    fallback?: string
  ) => string
): string => {
  const vl = (voiceLang || 'english').toLowerCase();
  const sl = (subtitleLang || vl).toLowerCase();
  const same = vl === sl;
  if (
    same &&
    (step === 'translate_voice_transcripts' ||
      step === 'translate_subtitle_transcripts')
  ) {
    return t(
      'processing.step.translatingTranscripts',
      undefined,
      'Translating Transcripts'
    );
  }
  return getStepLabel(step, t);
};

const normalizeErrors = (
  errors: unknown,
  fallbackStep: string,
  fallbackTimestamp: string
): Array<{ step: string; error: string; timestamp: string }> => {
  if (!Array.isArray(errors)) return [];
  return errors
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          step: fallbackStep || 'unknown_step',
          error: entry,
          timestamp: fallbackTimestamp,
        };
      }
      if (entry && typeof entry === 'object') {
        const step = String(
          (entry as any).step || fallbackStep || 'unknown_step'
        );
        const error = String(
          (entry as any).error || (entry as any).message || ''
        );
        const timestamp = String((entry as any).timestamp || fallbackTimestamp);
        return { step, error, timestamp };
      }
      return {
        step: fallbackStep || 'unknown_step',
        error: String(entry ?? ''),
        timestamp: fallbackTimestamp,
      };
    })
    .filter((item) => item.error.length > 0);
};

const inferStepsFromTask = (task: Task, state: any) => {
  // Determine the type of processing based on task characteristics
  const taskType = task.task_type || (state && state.task_type) || '';

  const coerceString = (...values: Array<unknown>): string | undefined => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return undefined;
  };

  const coerceBoolean = (
    defaultValue: boolean,
    ...values: Array<unknown>
  ): boolean => {
    for (const value of values) {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
      }
    }
    return defaultValue;
  };

  const sourceType =
    coerceString(
      (task as any)?.source,
      state?.source_type,
      state?.source,
      task.file_ext,
      state?.file_ext,
      task.kwargs?.file_ext
    ) || '';
  const normalizedSource = sourceType.toLowerCase();
  const isPDF = normalizedSource === '.pdf' || normalizedSource === 'pdf';

  const generateVideo = coerceBoolean(
    true,
    (task as any)?.generate_video,
    task.kwargs?.generate_video,
    state?.generate_video
  );
  const generatePodcast = coerceBoolean(
    false,
    (task as any)?.generate_podcast,
    task.kwargs?.generate_podcast,
    state?.generate_podcast
  );
  const generateAvatar = coerceBoolean(
    false,
    (task as any)?.generate_avatar,
    task.kwargs?.generate_avatar,
    state?.generate_avatar
  );
  const generateSubtitles = coerceBoolean(
    true,
    (task as any)?.generate_subtitles,
    task.kwargs?.generate_subtitles,
    state?.generate_subtitles
  );

  const voiceLanguage =
    coerceString(
      task.voice_language,
      task.kwargs?.voice_language,
      state?.voice_language
    ) || 'english';
  const subtitleLanguage =
    coerceString(
      task.subtitle_language,
      task.kwargs?.subtitle_language,
      state?.subtitle_language
    ) || voiceLanguage;
  const transcriptLanguage =
    coerceString(
      task.kwargs?.transcript_language,
      state?.podcast_transcript_language
    ) || null;

  // Initialize empty steps object
  const steps: Record<string, any> = {};

  if (isPDF) {
    // Add PDF-specific steps
    steps['segment_pdf_content'] = { status: 'pending', data: null };
    steps['revise_pdf_transcripts'] = { status: 'pending', data: null };

    // Add translation steps if needed
    if (voiceLanguage.toLowerCase() !== 'english') {
      steps['translate_voice_transcripts'] = { status: 'pending', data: null };
    }
    if (subtitleLanguage && subtitleLanguage.toLowerCase() !== 'english') {
      steps['translate_subtitle_transcripts'] = {
        status: 'pending',
        data: null,
      };
    }

    if (generateVideo) {
      steps['generate_pdf_chapter_images'] = { status: 'pending', data: null };
      steps['generate_pdf_audio'] = { status: 'pending', data: null };
      if (generateSubtitles) {
        steps['generate_pdf_subtitles'] = { status: 'pending', data: null };
      }
      steps['compose_video'] = { status: 'pending', data: null };
    }

    if (generatePodcast) {
      steps['generate_podcast_script'] = { status: 'pending', data: null };
      if (
        transcriptLanguage &&
        transcriptLanguage.toLowerCase() !== 'english'
      ) {
        steps['translate_podcast_script'] = { status: 'pending', data: null };
      }
      steps['generate_podcast_audio'] = { status: 'pending', data: null };
      steps['compose_podcast'] = { status: 'pending', data: null };
    }
  } else {
    // Add presentation-specific steps
    steps['extract_slides'] = { status: 'pending', data: null };
    steps['convert_slides_to_images'] = { status: 'pending', data: null };
    steps['analyze_slide_images'] = { status: 'pending', data: null };
    steps['generate_transcripts'] = { status: 'pending', data: null };
    steps['revise_transcripts'] = { status: 'pending', data: null };

    // Add translation steps if needed
    if (voiceLanguage.toLowerCase() !== 'english') {
      steps['translate_voice_transcripts'] = { status: 'pending', data: null };
    }
    if (subtitleLanguage && subtitleLanguage.toLowerCase() !== 'english') {
      steps['translate_subtitle_transcripts'] = {
        status: 'pending',
        data: null,
      };
    }

    if (generateVideo) {
      steps['generate_audio'] = { status: 'pending', data: null };
      if (generateAvatar) {
        steps['generate_avatar_videos'] = { status: 'pending', data: null };
      }
      if (generateSubtitles && subtitleLanguage) {
        const voiceNormalized = voiceLanguage.toLowerCase();
        const subtitleNormalized = subtitleLanguage.toLowerCase();
        if (voiceNormalized !== subtitleNormalized) {
          steps['generate_subtitle_transcripts'] = {
            status: 'pending',
            data: null,
          };
        }
      }
      if (generateSubtitles) {
        steps['generate_subtitles'] = { status: 'pending', data: null };
      }
      steps['compose_video'] = { status: 'pending', data: null };
    }
  }

  return steps;
};

const TaskProgressModal = ({
  open,
  task,
  onClose,
  onCancel,
}: TaskProgressModalProps) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Prefetch related task data when the modal is opened
  useEffect(() => {
    if (open && task?.task_id) {
      // Prefetch task details for better performance when user navigates to task detail page
      prefetchTaskDetail(undefined as any, task.task_id);
    }
  }, [open, task?.task_id]);

  // Use task query with polling for active tasks
  const shouldPoll =
    open &&
    task?.task_id &&
    (task.status === 'processing' ||
      task.status === 'queued' ||
      task.status === 'pending' ||
      task.status === 'failed');

  const { data: updatedTask } = useTaskQuery(
    task?.task_id || '',
    task || null,
    shouldPoll
      ? {
          refetchInterval: 3000, // Poll every 3 seconds for active tasks
          staleTime: 2000, // Consider data stale after 2 seconds when polling
          // Disable polling when page is not visible to enable bfcache
          refetchIntervalInBackground: false,
        }
      : undefined
  );

  // Determine which task data to use - updated task from query or original prop
  const effectiveTask = updatedTask || task;

  const retryMutation = useMutation({
    mutationFn: ({ step, taskId }: { step: string; taskId: string }) =>
      retryTask(taskId, step),
    onSuccess: async (_data, variables) => {
      showSuccessToast(
        t(
          'processing.retryQueued',
          undefined,
          "Retry queued. We'll resume shortly."
        )
      );
      try {
        await queryClient.invalidateQueries({
          queryKey: ['progress', variables.taskId],
        });
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } catch {}
    },
    onError: (error) => {
      console.error('Task retry failed', error);
      showErrorToast(
        t(
          'processing.retryFailed',
          undefined,
          'Could not retry the task. Please try again.'
        )
      );
    },
  });

  const handleRetryStep = useCallback(
    (step: string) => {
      const activeTaskId = effectiveTask?.task_id || task?.task_id;
      if (!activeTaskId || retryMutation.isPending) return;
      retryMutation.mutate({ step, taskId: activeTaskId });
    },
    [effectiveTask?.task_id, retryMutation, task?.task_id]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || (event as any).keyCode === 27) {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const details = useMemo(() => {
    if (!effectiveTask) return null;
    const state =
      (effectiveTask.detailed_state as any) || effectiveTask.state || {};
    const createdAt = String(
      state.created_at || effectiveTask.created_at || ''
    );
    const updatedAt = String(
      state.updated_at || effectiveTask.updated_at || ''
    );
    const stepErrors = normalizeErrors(
      state.errors,
      state.current_step,
      updatedAt || createdAt || new Date().toISOString()
    );

    // More robust steps extraction - try multiple possible locations
    let stepsData = state.steps || {};

    // If stepsData is still empty, check if it might be in a nested structure
    if (
      (!stepsData || Object.keys(stepsData).length === 0) &&
      effectiveTask.state &&
      typeof effectiveTask.state === 'object'
    ) {
      stepsData = (effectiveTask.state as any).steps || {};
    }

    // If still empty, check detailed_state
    if (
      (!stepsData || Object.keys(stepsData).length === 0) &&
      effectiveTask.detailed_state &&
      typeof effectiveTask.detailed_state === 'object'
    ) {
      stepsData = (effectiveTask.detailed_state as any).steps || {};
    }

    // Additional fallback: Check if steps exist directly in task object
    if (
      (!stepsData || Object.keys(stepsData).length === 0) &&
      (effectiveTask as any).steps &&
      typeof (effectiveTask as any).steps === 'object'
    ) {
      stepsData = (effectiveTask as any).steps || {};
    }

    // Additional fallback: Check if steps might be nested under a specific property in detailed_state
    if (
      (!stepsData || Object.keys(stepsData).length === 0) &&
      typeof effectiveTask.detailed_state === 'object'
    ) {
      const detailedState = effectiveTask.detailed_state as any;
      // Check for various possible step-related properties
      if (detailedState.steps) {
        stepsData = detailedState.steps;
      } else if (detailedState.processingSteps) {
        stepsData = detailedState.processingSteps;
      } else if (detailedState.pipeline_steps) {
        stepsData = detailedState.pipeline_steps;
      } else if (detailedState.workflow) {
        stepsData = detailedState.workflow;
      }
    }

    // If steps are still empty, try to create default steps based on task characteristics
    if (!stepsData || Object.keys(stepsData).length === 0) {
      stepsData = inferStepsFromTask(effectiveTask, state);
    }

    const extractStringValue = (value: unknown): string | null => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          const nested = extractStringValue(entry);
          if (nested) return nested;
        }
        return null;
      }
      if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const direct = extractStringValue(
          obj.id ??
            obj.voice_id ??
            obj.voiceId ??
            obj.value ??
            obj.text ??
            obj.name ??
            obj.display_name ??
            obj.displayName
        );
        if (direct) return direct;
      }
      return null;
    };

    const getValueAtPath = (source: unknown, path: string[]): unknown => {
      if (!source) return undefined;
      let current: unknown = source;
      for (const segment of path) {
        if (current === null) return undefined;
        if (Array.isArray(current)) {
          const index = Number(segment);
          if (Number.isInteger(index) && index >= 0 && index < current.length) {
            current = current[index];
          } else {
            return undefined;
          }
        } else if (typeof current === 'object') {
          current = (current as Record<string, unknown>)[segment];
        } else {
          return undefined;
        }
      }
      return current;
    };

    const pickFirstFromPaths = (
      sources: Array<object>,
      paths: Array<string[]>
    ): string | null => {
      for (const source of sources) {
        for (const path of paths) {
          const value = getValueAtPath(source, path);
          const extracted = extractStringValue(value);
          if (extracted) return extracted;
        }
      }
      return null;
    };

    const findStringByKeys = (
      sources: Array<object>,
      keyNames: string[],
      maxDepth = 6
    ): string | null => {
      if (!keyNames.length) return null;
      const normalizedNames = keyNames.map((name) => name.toLowerCase());
      const seen = new Set<object>();
      type QueueItem = { value: unknown; depth: number };
      const queue: QueueItem[] = sources.map((value) => ({
        value,
        depth: 0,
      }));

      while (queue.length > 0) {
        const { value, depth } = queue.shift()!;
        if (!value || typeof value !== 'object') continue;
        if (seen.has(value as object)) continue;
        seen.add(value as object);

        const entries: Array<[string, unknown]> = Array.isArray(value)
          ? (value as Array<unknown>).map(
              (item, index) => [String(index), item] as [string, unknown]
            )
          : Object.entries(value as Record<string, unknown>);

        for (const [key, child] of entries) {
          const normalizedKey = key.toLowerCase();
          if (
            normalizedNames.some(
              (candidate) =>
                normalizedKey === candidate ||
                normalizedKey.endsWith(candidate) ||
                normalizedKey.includes(candidate)
            )
          ) {
            const extracted = extractStringValue(child);
            if (extracted) return extracted;
          }

          if (
            child &&
            typeof child === 'object' &&
            depth < maxDepth &&
            !seen.has(child as object)
          ) {
            queue.push({ value: child, depth: depth + 1 });
          }
        }
      }

      return null;
    };

    const collectCandidateSources = (): Array<object> => {
      const candidates: Array<object> = [];
      const append = (value: unknown) => {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !candidates.includes(value as object)
        ) {
          candidates.push(value as object);
        }
      };

      append(state);
      append((state as any)?.kwargs);
      append((state as any)?.task_kwargs);
      append((state as any)?.config);
      append((state as any)?.task_config);
      append((state as any)?.settings);
      append((state as any)?.data);
      append((state as any)?.result);
      append((state as any)?.output);
      append((state as any)?.podcast);
      append((state as any)?.podcast?.voices);

      append(effectiveTask);
      append(effectiveTask.kwargs);
      append(effectiveTask.state);
      append((effectiveTask as any)?.result);
      append((effectiveTask as any)?.output);
      append((effectiveTask.state as any)?.kwargs);
      append((effectiveTask.state as any)?.task_kwargs);
      append((effectiveTask.state as any)?.config);
      append((effectiveTask.state as any)?.task_config);
      append((effectiveTask.state as any)?.settings);
      append((effectiveTask.state as any)?.podcast);
      append((effectiveTask.state as any)?.podcast?.voices);
      append((effectiveTask.state as any)?.result);
      append((effectiveTask.state as any)?.output);

      append(effectiveTask.detailed_state);
      append((effectiveTask.detailed_state as any)?.kwargs);
      append((effectiveTask.detailed_state as any)?.task_kwargs);
      append((effectiveTask.detailed_state as any)?.config);
      append((effectiveTask.detailed_state as any)?.task_config);
      append((effectiveTask.detailed_state as any)?.settings);
      append((effectiveTask.detailed_state as any)?.podcast);
      append((effectiveTask.detailed_state as any)?.podcast?.voices);
      append((effectiveTask.detailed_state as any)?.result);
      append((effectiveTask.detailed_state as any)?.output);

      if (stepsData && typeof stepsData === 'object') {
        append(stepsData);
        Object.values(stepsData).forEach((stepEntry) => {
          append(stepEntry);
          append((stepEntry as any)?.data);
          append((stepEntry as any)?.result);
        });
      }

      return candidates;
    };

    const candidateSources = collectCandidateSources();

    const voiceIdPaths: string[][] = [
      ['voice_id'],
      ['voiceId'],
      ['voice', 'voice_id'],
      ['voice', 'voiceId'],
      ['voice', 'id'],
      ['voice', 'name'],
      ['config', 'voice_id'],
      ['config', 'voiceId'],
      ['config', 'voice', 'id'],
      ['settings', 'voice_id'],
      ['settings', 'voiceId'],
      ['task_config', 'voice_id'],
      ['task_config', 'voiceId'],
      ['task_config', 'voice', 'id'],
      ['task_config', 'video', 'voice_id'],
      ['task_config', 'video', 'voice', 'id'],
      ['task_kwargs', 'voice_id'],
      ['kwargs', 'voice_id'],
      ['video', 'voice_id'],
      ['video', 'voice', 'id'],
      ['config', 'video', 'voice_id'],
      ['config', 'video', 'voice', 'id'],
      ['settings', 'video', 'voice_id'],
      ['result', 'voice_id'],
      ['result', 'voice', 'id'],
      ['output', 'voice_id'],
      ['generate_audio', 'result', 'voice_id'],
      ['generate_podcast_audio', 'result', 'voice_id'],
    ];

    const podcastHostPaths: string[][] = [
      ['podcast_host_voice'],
      ['kwargs', 'podcast_host_voice'],
      ['task_kwargs', 'podcast_host_voice'],
      ['config', 'podcast_host_voice'],
      ['task_config', 'podcast_host_voice'],
      ['settings', 'podcast_host_voice'],
      ['config', 'podcast', 'host_voice'],
      ['task_config', 'podcast', 'host_voice'],
      ['podcast', 'host_voice'],
      ['podcast', 'hostVoice'],
      ['podcast', 'host', 'voice_id'],
      ['podcast', 'host', 'id'],
      ['podcast', 'host', 'name'],
      ['podcast', 'voices', 'host'],
      ['podcast', 'voices', 'host_voice'],
      ['podcast', 'voices', 'hostVoice'],
      ['podcast', 'voices', 'host', 'voice_id'],
      ['task_config', 'podcast', 'voices', 'host'],
      ['config', 'podcast', 'voices', 'host'],
      ['generate_podcast_audio', 'result', 'host_voice'],
      ['generate_podcast_audio', 'result', 'host_voice_id'],
      ['result', 'host_voice'],
      ['result', 'host_voice_id'],
    ];

    const podcastGuestPaths: string[][] = [
      ['podcast_guest_voice'],
      ['kwargs', 'podcast_guest_voice'],
      ['task_kwargs', 'podcast_guest_voice'],
      ['config', 'podcast_guest_voice'],
      ['task_config', 'podcast_guest_voice'],
      ['settings', 'podcast_guest_voice'],
      ['config', 'podcast', 'guest_voice'],
      ['task_config', 'podcast', 'guest_voice'],
      ['podcast', 'guest_voice'],
      ['podcast', 'guestVoice'],
      ['podcast', 'guest', 'voice_id'],
      ['podcast', 'guest', 'id'],
      ['podcast', 'guest', 'name'],
      ['podcast', 'voices', 'guest'],
      ['podcast', 'voices', 'guest_voice'],
      ['podcast', 'voices', 'guestVoice'],
      ['podcast', 'voices', 'guest', 'voice_id'],
      ['task_config', 'podcast', 'voices', 'guest'],
      ['config', 'podcast', 'voices', 'guest'],
      ['generate_podcast_audio', 'result', 'guest_voice'],
      ['generate_podcast_audio', 'result', 'guest_voice_id'],
      ['result', 'guest_voice'],
      ['result', 'guest_voice_id'],
    ];

    const voiceId =
      pickFirstFromPaths(candidateSources, voiceIdPaths) ??
      findStringByKeys(candidateSources, ['voice_id', 'voiceid']);

    const podcastHostVoice =
      pickFirstFromPaths(candidateSources, podcastHostPaths) ??
      findStringByKeys(candidateSources, [
        'podcast_host_voice',
        'host_voice',
        'hostvoice',
      ]);

    const podcastGuestVoice =
      pickFirstFromPaths(candidateSources, podcastGuestPaths) ??
      findStringByKeys(candidateSources, [
        'podcast_guest_voice',
        'guest_voice',
        'guestvoice',
      ]);

    const stateKwargs =
      (state as any)?.kwargs && typeof (state as any)?.kwargs === 'object'
        ? ((state as any).kwargs as Record<string, unknown>)
        : undefined;
    const stateTaskKwargs =
      (state as any)?.task_kwargs &&
      typeof (state as any)?.task_kwargs === 'object'
        ? ((state as any).task_kwargs as Record<string, unknown>)
        : undefined;
    const stateConfig =
      (state as any)?.config && typeof (state as any)?.config === 'object'
        ? ((state as any).config as Record<string, unknown>)
        : undefined;
    const stateTaskConfig =
      (state as any)?.task_config &&
      typeof (state as any)?.task_config === 'object'
        ? ((state as any).task_config as Record<string, unknown>)
        : undefined;
    const stateSettings =
      (state as any)?.settings && typeof (state as any)?.settings === 'object'
        ? ((state as any).settings as Record<string, unknown>)
        : undefined;

    // Improved progress calculation with better error handling and debugging
    const calculateProgress = (): number => {
      // Try multiple sources for progress information
      const progressSources = [
        effectiveTask.completion_percentage,
        state.completion_percentage,
        (effectiveTask as any).progress,
        state.progress,
      ];

      for (const progress of progressSources) {
        if (typeof progress === 'number' && Number.isFinite(progress)) {
          const clampedProgress = Math.max(
            0,
            Math.min(100, Math.round(progress))
          );
          // Debug log for progress tracking
          if (process.env.NODE_ENV === 'development') {
            console.debug(
              'TaskProgressModal: Using progress value:',
              progress,
              'clamped to:',
              clampedProgress
            );
          }
          return clampedProgress;
        }
      }

      // If we have steps data, we can try to calculate progress based on step completion
      if (stepsData && typeof stepsData === 'object') {
        const stepKeys = Object.keys(stepsData);
        if (stepKeys.length > 0) {
          const completedSteps = stepKeys.filter((key) => {
            const step = stepsData[key];
            return (
              step &&
              typeof step === 'object' &&
              step.status &&
              (step.status === 'completed' || step.status === 'success')
            );
          }).length;

          const calculatedProgress = Math.round(
            (completedSteps / stepKeys.length) * 100
          );
          // Debug log for calculated progress
          if (process.env.NODE_ENV === 'development') {
            console.debug(
              'TaskProgressModal: Calculated progress from steps:',
              completedSteps,
              '/',
              stepKeys.length,
              '=',
              calculatedProgress
            );
          }
          return calculatedProgress;
        }
      }

      // Debug log for default progress
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          'TaskProgressModal: No progress information available, defaulting to 0'
        );
      }

      // Default to 0 if no progress information is available
      return 0;
    };

    // Simplified and more reliable filename extraction logic
    const extractFilename = (): string => {
      try {
        if (
          effectiveTask.filename &&
          typeof effectiveTask.filename === 'string'
        ) {
          return effectiveTask.filename;
        }
        // Primary source: task kwargs filename
        if (
          effectiveTask.kwargs?.filename &&
          typeof effectiveTask.kwargs.filename === 'string'
        ) {
          return effectiveTask.kwargs.filename;
        }

        // Fallback to state filename
        if (state.filename && typeof state.filename === 'string') {
          return state.filename;
        }

        // Try to extract from file_path in various locations
        const filePath =
          state.file_path ||
          (effectiveTask.state as any)?.file_path ||
          (effectiveTask.detailed_state as any)?.file_path ||
          (effectiveTask.kwargs as any)?.file_path;
        if (filePath && typeof filePath === 'string') {
          const filename = filePath.split('/').pop();
          if (filename) {
            return filename;
          }
        }

        // Create filename from upload_id and extension if available
        const extCandidate =
          effectiveTask.file_ext ||
          effectiveTask.kwargs?.file_ext ||
          (typeof state.file_ext === 'string' ? state.file_ext : undefined);
        if (
          effectiveTask.upload_id &&
          extCandidate &&
          typeof effectiveTask.upload_id === 'string' &&
          typeof extCandidate === 'string'
        ) {
          // Ensure file_ext starts with a dot
          const ext = extCandidate.startsWith('.')
            ? extCandidate
            : `.${extCandidate}`;
          return `${effectiveTask.upload_id}${ext}`;
        }

        // Fallback to task_id with extension if available
        if (
          effectiveTask.task_id &&
          extCandidate &&
          typeof effectiveTask.task_id === 'string' &&
          typeof extCandidate === 'string'
        ) {
          // Ensure file_ext starts with a dot
          const ext = extCandidate.startsWith('.')
            ? extCandidate
            : `.${extCandidate}`;
          return `${effectiveTask.task_id}${ext}`;
        }

        // Try to construct filename from upload_id without extension
        if (
          effectiveTask.upload_id &&
          typeof effectiveTask.upload_id === 'string'
        ) {
          return `${effectiveTask.upload_id}`;
        }

        // Try to construct filename from task_id without extension
        if (
          effectiveTask.task_id &&
          typeof effectiveTask.task_id === 'string'
        ) {
          return `${effectiveTask.task_id}`;
        }

        // Last resort: generic name
        return 'Processing file';
      } catch (error) {
        // In case of any error, return a default filename
        console.warn('Error extracting filename:', error);
        return 'Processing file';
      }
    };

    const progress = calculateProgress();
    const filename = extractFilename();

    // Debug log for computed details
    if (process.env.NODE_ENV === 'development') {
      console.debug('TaskProgressModal: Computed details:', {
        status: effectiveTask.status,
        progress,
        filename,
        stepsCount: stepsData ? Object.keys(stepsData).length : 0,
      });
    }

    const computed: ProcessingDetails & {
      task_type?: string;
      generate_avatar?: boolean;
      generate_subtitles?: boolean;
    } = {
      status: effectiveTask.status,
      progress,
      current_step: state.current_step || '',
      steps: stepsData,
      errors: stepErrors,
      filename,
      file_ext:
        effectiveTask.file_ext ||
        effectiveTask.kwargs?.file_ext ||
        state.file_ext,
      voice_language:
        state.voice_language ||
        effectiveTask.kwargs?.voice_language ||
        effectiveTask.voice_language,
      subtitle_language:
        state.subtitle_language ||
        state.podcast_transcript_language ||
        effectiveTask.kwargs?.subtitle_language ||
        effectiveTask.kwargs?.transcript_language ||
        effectiveTask.subtitle_language ||
        undefined,
      created_at: createdAt || new Date().toISOString(),
      updated_at: updatedAt || createdAt || new Date().toISOString(),
    };

    if (stateKwargs) {
      computed.kwargs = stateKwargs;
    } else if (
      effectiveTask.kwargs &&
      typeof effectiveTask.kwargs === 'object'
    ) {
      computed.kwargs = effectiveTask.kwargs as Record<string, unknown>;
    }

    if (stateTaskKwargs) {
      computed.task_kwargs = stateTaskKwargs;
    } else if (
      (effectiveTask as any)?.task_kwargs &&
      typeof (effectiveTask as any).task_kwargs === 'object'
    ) {
      computed.task_kwargs = (effectiveTask as any).task_kwargs as Record<
        string,
        unknown
      >;
    }

    if (stateConfig) {
      computed.config = stateConfig;
    } else if (
      (effectiveTask.detailed_state as any)?.config &&
      typeof (effectiveTask.detailed_state as any)?.config === 'object'
    ) {
      computed.config = (effectiveTask.detailed_state as any).config as Record<
        string,
        unknown
      >;
    }

    if (stateTaskConfig) {
      computed.task_config = stateTaskConfig;
    } else if (
      (effectiveTask.detailed_state as any)?.task_config &&
      typeof (effectiveTask.detailed_state as any)?.task_config === 'object'
    ) {
      computed.task_config = (effectiveTask.detailed_state as any)
        .task_config as Record<string, unknown>;
    }

    if (stateSettings) {
      computed.settings = stateSettings;
    } else if (
      (effectiveTask.detailed_state as any)?.settings &&
      typeof (effectiveTask.detailed_state as any)?.settings === 'object'
    ) {
      computed.settings = (effectiveTask.detailed_state as any)
        .settings as Record<string, unknown>;
    }

    if (voiceId) {
      computed.voice_id = voiceId;
    }

    if (podcastHostVoice) {
      computed.podcast_host_voice = podcastHostVoice;
    }

    if (podcastGuestVoice) {
      computed.podcast_guest_voice = podcastGuestVoice;
    }

    if (!computed.steps || typeof computed.steps !== 'object') {
      computed.steps = {};
    }

    // Ensure steps are properly sorted according to the defined processing order
    // This ensures the steps display in the correct sequence even when inferred from task characteristics
    const sortedSteps = sortSteps(computed.steps);
    computed.steps = Object.fromEntries(sortedSteps);

    if (state.task_type || effectiveTask.task_type) {
      computed.task_type = String(
        state.task_type || effectiveTask.task_type || ''
      ).toLowerCase();
    }

    if (typeof state.generate_avatar === 'boolean') {
      computed.generate_avatar = state.generate_avatar;
    }
    if (typeof state.generate_subtitles === 'boolean') {
      computed.generate_subtitles = state.generate_subtitles;
    }

    return computed;
  }, [effectiveTask]);

  // Use focus trap for the modal
  const modalRef = useFocusTrap(open && !!task);

  if (!open || !task) return null;
  // Note: we intentionally don't check for !details here as it might be computed later

  const handleStop = () => {
    if (!task.task_id) return;
    onCancel(task.task_id);
  };

  const modalTitle = t(
    'processing.modal.title',
    undefined,
    'Processing details'
  );
  const closeLabel = t(
    'processing.modal.close',
    undefined,
    'Close processing details'
  );
  const displayFileName =
    details?.filename ||
    task.filename ||
    task.state?.filename ||
    task.kwargs?.filename ||
    t('processing.file.untitled', undefined, 'Untitled');
  const shortTaskId = task.task_id
    ? `${task.task_id.slice(0, 6)}…${task.task_id.slice(-4)}`
    : null;

  return (
    <div
      className="processing-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="processing-modal__content"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="processing-modal__header">
          <div className="processing-modal__title">
            <span aria-hidden="true">⚙️</span>
            <span id="processing-modal-title">{displayFileName}</span>
            {shortTaskId && (
              <span className="processing-modal__subtitle">
                {t('processing.meta.taskId', undefined, 'Task ID')}:{' '}
                {shortTaskId}
              </span>
            )}
          </div>
          <button
            type="button"
            className="processing-modal__close"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="processing-modal__body">
          <TaskProcessingSteps
            taskId={task.task_id}
            uploadId={task.upload_id}
            fileName={details?.filename || null}
            progress={details?.progress ?? 0}
            onStop={handleStop}
            processingDetails={details || {}}
            onRetryFromStep={task.task_id ? handleRetryStep : undefined}
            isRetrying={retryMutation.isPending}
            formatStepNameWithLanguages={(step, vl, sl) =>
              formatStepName(step, vl, sl, t)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default TaskProgressModal;
