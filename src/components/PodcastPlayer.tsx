import React, { useMemo } from 'react';
import AudioPlayer from '@/components/AudioPlayer';
import { buildCuesFromPodcastDialogue } from '@/utils/transcript';
import type { PodcastScriptResponse } from '@/types';
import { usePodcastSubtitlesQuery } from '@/services/queries';
import type { Cue } from '@/components/TranscriptList';

type PodcastPlayerProps = {
  taskId: string;
  src: string;
  script?: PodcastScriptResponse | null;
  className?: string;
};

const PodcastPlayer = ({
  taskId,
  src,
  script,
  className,
}: PodcastPlayerProps) => {
  const { data: subtitleData } = usePodcastSubtitlesQuery(
    taskId,
    Boolean(taskId)
  );

  const fallbackCues = useMemo<Cue[] | undefined>(() => {
    const dialogue = script?.dialogue;
    if (!Array.isArray(dialogue) || dialogue.length === 0) return undefined;
    return buildCuesFromPodcastDialogue(
      dialogue,
      5, // segmentSeconds
      script?.host_voice,
      script?.guest_voice
    );
  }, [script]);

  const cues: Cue[] | undefined =
    subtitleData?.cues && subtitleData.cues.length > 0
      ? (subtitleData.cues as Cue[])
      : fallbackCues;
  const vttUrl = subtitleData?.vtt_url || undefined;

  return (
    <AudioPlayer
      src={src}
      initialCues={cues}
      vttUrl={vttUrl}
      showTranscript
      className={className}
    />
  );
};

export default PodcastPlayer;
