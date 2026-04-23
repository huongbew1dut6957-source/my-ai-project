"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResumeProfile } from "@/lib/types";
import { PublicResumePage } from "@/components/public/public-resume-page";

export const LANDSCAPE_STAGE_WIDTH = 1414;
export const LANDSCAPE_STAGE_HEIGHT = 1000;
const STAGE_PADDING = 18;

export function ResumeStage({ resume }: { resume: ResumeProfile }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(LANDSCAPE_STAGE_HEIGHT);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateScale = () => {
      const nextHeight = element.scrollHeight;
      setContentHeight(nextHeight);
      const availableHeight = LANDSCAPE_STAGE_HEIGHT - STAGE_PADDING * 2;
      const nextScale = Math.min(1, availableHeight / nextHeight);
      setScale(nextScale);
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [resume]);

  const scaledHeight = useMemo(() => contentHeight * scale, [contentHeight, scale]);
  const offsetX = (LANDSCAPE_STAGE_WIDTH - LANDSCAPE_STAGE_WIDTH * scale) / 2;
  const offsetY = Math.max(STAGE_PADDING, (LANDSCAPE_STAGE_HEIGHT - scaledHeight) / 2);

  return (
    <div
      className="overflow-hidden rounded-[28px] border border-black/10 bg-[#efe7db]"
      style={{
        width: LANDSCAPE_STAGE_WIDTH,
        height: LANDSCAPE_STAGE_HEIGHT,
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          style={{
            position: "absolute",
            left: offsetX,
            top: offsetY,
            width: LANDSCAPE_STAGE_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div ref={contentRef}>
            <PublicResumePage resume={resume} preview className="w-[1414px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
