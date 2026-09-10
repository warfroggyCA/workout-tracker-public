"use client";

import { useEffect, useRef, useState } from "react";
import type { FroggyFormConfig } from "@/lib/froggy-form-config";
import styles from "./froggy-thumbnail.module.css";

/** Small transparent sprite only; full demonstration media remains lazy. */
export function FroggyThumbnail({ config, paused }: { config: FroggyFormConfig; paused: boolean }) {
  const container = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = config.animatedThumbnail;

  useEffect(() => {
    if (!source) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    function update() {
      const allowed = !reduced.matches && document.visibilityState === "visible";
      setMotionAllowed(allowed);
      if (inView && allowed && !paused) setRequested(true);
    }
    reduced.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      setVisible(inView);
      update();
    });
    observer.observe(container.current!);
    return () => {
      observer.disconnect(); reduced.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [source, paused]);

  return <span ref={container} className="absolute inset-0 overflow-hidden" aria-hidden="true">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`${config.media}/${config.thumbnail}`} alt="" width={64} height={64} loading="lazy" className={config.thumbnailClass} style={{ opacity: ready && motionAllowed && !failed ? 0 : 1 }} />
    {requested && !failed && <span className={`absolute inset-0 ${ready && motionAllowed ? "opacity-100" : "opacity-0"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={source} alt="" width={1024} height={1152} draggable={false}
        onLoad={() => setReady(true)} onError={() => setFailed(true)}
        className={styles.sprite} style={{ animationPlayState: visible && motionAllowed && !paused ? "running" : "paused" }} />
    </span>}
  </span>;
}
