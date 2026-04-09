"use client";
import React from "react";
import { Button } from "../ui/Button";
import type { ResolvedStartScreenCopy } from "@/utils/resolveStartScreenCopy";

export function StartScreen({
  onStart,
  copy,
}: {
  onStart: () => void;
  copy: ResolvedStartScreenCopy;
}) {
  return (
    <div className="quiz-container mt-12 mb-10 text-center" style={{ color: "#153060" }}>
      <p className="mb-2 text-left">{copy.description}</p>

      <div className="mt-6 flex justify-center space-x-6">
        <div className="flex flex-col items-center">
          <img src="/checkCircle.svg" alt="" className="w-6 h-6 mb-2" />
          <span className="text-sm font-semibold">{copy.feature1}</span>
        </div>
        <div className="flex flex-col items-center">
          <img src="/clockIcon.svg" alt="" className="w-6 h-6 mb-2" />
          <span className="text-sm font-semibold">{copy.feature3}</span>
        </div>
        <div className="flex flex-col items-center">
          <img src="/graduationCap.svg" alt="" className="w-6 h-6 mb-2" />
          <span className="text-sm font-semibold">{copy.feature2}</span>
        </div>
      </div>
      <div className="mt-6 mb-6 text-sm text-left">{copy.footer}</div>

      <Button onClick={onStart}>{copy.button}</Button>
    </div>
  );
}
