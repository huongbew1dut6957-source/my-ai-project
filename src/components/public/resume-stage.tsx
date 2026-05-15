"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResumeProfile } from "@/lib/types";
import { ResumePdfPage } from "@/components/public/resume-pdf-page";

export const STAGE_WIDTH = 794;
const STAGE_PADDING = 24;

export function ResumeStage({ resume }: { resume: ResumeProfile }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageHeight, setStageHeight] = useState(1123);

  useEffect(() => {
    const element = contentRef.current;
    const container = containerRef.current;
    if (!element || !container) return;

    const updateScale = () => {
      const contentH = element.scrollHeight + STAGE_PADDING * 2;
      setStageHeight(Math.max(600, contentH));

      const containerW = container.clientWidth;
      const availableW = containerW - STAGE_PADDING * 2;
      const nextScale = Math.min(1, availableW / STAGE_WIDTH);
      setScale(nextScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    observer.observe(container);

    return () => observer.disconnect();
  }, [resume]);

  const scaledWidth = STAGE_WIDTH * scale;
  const scaledHeight = stageHeight * scale;
  const offsetX = (STAGE_WIDTH - scaledWidth) / 2;

  return (
    <div
      ref={containerRef}
      className="flex items-start justify-center rounded-2xl bg-[#e8e4df] p-4"
      style={{ minHeight: stageHeight }}
    >
      <div
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        style={{
          width: scaledWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div ref={contentRef}>
          <ResumePdfPage resume={resume} />
        </div>
      </div>
    </div>
  );
}
