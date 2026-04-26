"use client";
import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/lib/projects";
import type { Take } from "@/lib/takes";
import { DevicePicker } from "./device-picker";
import { PrerecordModal } from "./prerecord-modal";
import { Recorder } from "./recorder";
import { LevelMeter } from "./level-meter";
import { TakeList } from "./take-list";
import { PipelineProgress } from "./pipeline-progress";
import { ABListen } from "./ab-listen";
import { StemMixer } from "./stem-mixer";

interface VoiceStudioProps {
  project: Project;
}

export function VoiceStudio({ project }: VoiceStudioProps) {
  const [deviceId, setDeviceId] = useState("");
  const [takes, setTakes] = useState<Take[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [activeJob, setActiveJob] = useState<{ jobId: string; takeId: string } | null>(null);
  const [listenTakeId, setListenTakeId] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const fetchTakes = useCallback(async () => {
    const r = await fetch(`/api/projects/${project.id}/takes`);
    if (r.ok) setTakes((await r.json()).takes);
  }, [project.id]);

  useEffect(() => { fetchTakes(); }, [fetchTakes]);

  const handleRecordClick = () => {
    const seen = sessionStorage.getItem("voice_checklist_seen");
    if (seen) return; // already shown
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    sessionStorage.setItem("voice_checklist_seen", "1");
    setShowModal(false);
  };

  const handleTakeUploaded = useCallback(async (_takeId: string) => {
    await fetchTakes();
  }, [fetchTakes]);

  const handleProcess = useCallback(async (takeId: string) => {
    setProcessingError(null);
    const take = takes.find((t) => t.id === takeId);
    const r = await fetch("/api/voice/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project_id: project.id,
        take_id: takeId,
        harmony: take?.harmony_enabled === 1,
      }),
    });
    if (!r.ok) {
      setProcessingError("Failed to start processing");
      return;
    }
    const { job_id } = await r.json();
    setActiveJob({ jobId: job_id, takeId });
  }, [project.id, takes]);

  const handleProcessDone = useCallback(async () => {
    const tid = activeJob?.takeId;
    setActiveJob(null);
    if (tid) {
      await fetch(`/api/projects/${project.id}/takes/${tid}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_processed: 1 }),
      });
      await fetchTakes();
      setListenTakeId(tid);
    }
  }, [activeJob, project.id, fetchTakes]);

  const handleDelete = useCallback(async (takeId: string) => {
    await fetch(`/api/projects/${project.id}/takes/${takeId}`, { method: "DELETE" });
    await fetchTakes();
    if (listenTakeId === takeId) setListenTakeId(null);
  }, [project.id, fetchTakes, listenTakeId]);

  const handleUpdate = useCallback(async (takeId: string, patch: Partial<Take>) => {
    await fetch(`/api/projects/${project.id}/takes/${takeId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    await fetchTakes();
  }, [project.id, fetchTakes]);

  const listenTake = takes.find((t) => t.id === listenTakeId);

  return (
    <div className="space-y-6 p-4">
      {showModal && (
        <PrerecordModal
          onConfirm={handleModalConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* Setup */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Setup</h2>
        <DevicePicker value={deviceId} onChange={setDeviceId} />
        <div className="flex items-center gap-3">
          <div onClick={handleRecordClick}>
            <Recorder
              deviceId={deviceId}
              projectId={project.id}
              onTakeUploaded={handleTakeUploaded}
            />
          </div>
          <LevelMeter stream={recordingStream} />
        </div>
      </section>

      {/* Processing progress */}
      {activeJob && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Processing</h2>
          <PipelineProgress
            jobId={activeJob.jobId}
            onDone={handleProcessDone}
            onError={(e) => { setProcessingError(e); setActiveJob(null); }}
          />
        </section>
      )}
      {processingError && (
        <p className="text-sm text-destructive">{processingError}</p>
      )}

      {/* Takes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Takes</h2>
        <TakeList
          takes={takes}
          projectId={project.id}
          onProcess={handleProcess}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      </section>

      {/* Listen */}
      {listenTake && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Listen</h2>
          <ABListen projectId={project.id} takeId={listenTake.id} />
          <StemMixer
            projectId={project.id}
            takeId={listenTake.id}
            hasHarmony={listenTake.harmony_enabled === 1}
          />
        </section>
      )}
    </div>
  );
}
