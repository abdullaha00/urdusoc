"use client";

import { useEffect, useRef } from "react";
import { iqbalQuote } from "@/lib/content";

/**
 * The Iqbal couplet, wiped away by birds as the section is scrolled through.
 *
 * Built on the prototype the 2026 committee left in attachments/, with three
 * changes it needed before it could ship:
 *
 *   1. It respects prefers-reduced-motion. The original drove a mask off raw
 *      scroll position with no opt-out, which is exactly the kind of motion
 *      that triggers vestibular symptoms. Reduced motion gets the finished
 *      quote, static and fully legible - no pin, no wipe, no flight.
 *   2. Scroll work is deferred to requestAnimationFrame. The original wrote to
 *      `maskImage` on every scroll event, forcing a style recalculation per
 *      event rather than per frame.
 *   3. The text is never *only* revealed by script. The mask starts fully
 *      opaque in CSS, so if the JavaScript fails or is still loading, the
 *      couplet is readable rather than invisible.
 *
 * The birds and stars are decorative. The couplet itself is real content in the
 * markup - a <blockquote> that reads correctly with the section unscrolled.
 */

/** Lanes the birds fly along, as percentages of the pinned viewport. */
const BIRDS = [
  { top: "38%", width: 64, strokeWidth: 2.6, startX: 128, endX: -12, delay: 0 },
  { top: "52%", width: 46, strokeWidth: 5.5, startX: 150, endX: 10, delay: 0.07 },
  { top: "45%", width: 52, strokeWidth: 5, startX: 114, endX: 32, delay: 0.14 },
];

/**
 * Fixed star positions and phases.
 *
 * Hard-coded rather than randomised: a random layout would differ between the
 * server render and the client hydration, and React would report a mismatch.
 */
const STARS = [
  { x: 8, y: 18, r: 1.1, delay: 0 },
  { x: 17, y: 62, r: 0.8, delay: 1.4 },
  { x: 24, y: 31, r: 1.4, delay: 0.6 },
  { x: 33, y: 76, r: 0.9, delay: 2.1 },
  { x: 41, y: 14, r: 1.2, delay: 1.1 },
  { x: 52, y: 68, r: 0.8, delay: 0.3 },
  { x: 61, y: 24, r: 1.3, delay: 1.8 },
  { x: 69, y: 58, r: 1, delay: 0.9 },
  { x: 78, y: 33, r: 1.1, delay: 2.4 },
  { x: 86, y: 71, r: 0.9, delay: 1.6 },
  { x: 92, y: 21, r: 1.2, delay: 0.5 },
  { x: 47, y: 42, r: 0.7, delay: 2.8 },
];

export function IqbalQuote() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const birdRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const mask = maskRef.current;
    if (!wrapper || !mask) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;

    const clear = () => {
      mask.style.removeProperty("mask-image");
      mask.style.removeProperty("-webkit-mask-image");
      for (const bird of birdRefs.current) {
        if (bird) bird.style.removeProperty("left");
      }
    };

    const draw = () => {
      frame = 0;

      const rect = wrapper.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress =
        scrollable > 0
          ? Math.min(1, Math.max(0, -rect.top / scrollable))
          : 0;

      // Hold the quote whole at either end, so it is readable on arrival and
      // fully gone before the pin releases.
      const t =
        progress < 0.12
          ? 0
          : progress > 0.88
            ? 1
            : (progress - 0.12) / 0.76;

      birdRefs.current.forEach((bird, index) => {
        if (!bird) return;
        const { startX, endX, delay } = BIRDS[index];
        const local = Math.min(1, Math.max(0, (t - delay) / (1 - delay)));
        bird.style.left = `${startX + (endX - startX) * local}%`;
      });

      const pct = t * 100;
      const gradient = `linear-gradient(to left, transparent 0%, transparent ${pct}%, black ${pct + 6}%, black 100%)`;
      mask.style.maskImage = gradient;
      mask.style.webkitMaskImage = gradient;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(draw);
    };

    const apply = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      if (reduceMotion.matches) {
        clear();
        return;
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      draw();
    };

    apply();
    reduceMotion.addEventListener("change", apply);

    return () => {
      reduceMotion.removeEventListener("change", apply);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      aria-labelledby="iqbal-quote-heading"
      className="border-y border-rule/70 bg-forest text-paper"
    >
      <h2 id="iqbal-quote-heading" className="sr-only">
        A verse from Allama Iqbal
      </h2>

      {/*
        The tall wrapper is the scroll distance; the sticky child is what stays
        on screen. Under reduced motion the effect is inert, so the wrapper
        collapses to one viewport and the section simply scrolls past.
      */}
      <div
        ref={wrapperRef}
        className="relative h-screen motion-safe:h-[250vh] md:motion-safe:h-[350vh]"
      >
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
          <Stars />

          {BIRDS.map((bird, index) => (
            <div
              key={bird.top}
              ref={(node) => {
                birdRefs.current[index] = node;
              }}
              aria-hidden
              className="absolute z-20 hidden motion-safe:block"
              style={{
                top: bird.top,
                width: bird.width,
                left: `${bird.startX}%`,
              }}
            >
              <Bird strokeWidth={bird.strokeWidth} />
            </div>
          ))}

          <div
            ref={maskRef}
            className="relative z-10 max-w-2xl px-6 text-center"
          >
            <blockquote className="iqbal-glow">
              {iqbalQuote.lines.map((line) => (
                <p key={line.english} className="mt-6 first:mt-0">
                  <span className="block font-serif text-2xl leading-snug italic text-balance sm:text-3xl">
                    {line.english}
                  </span>
                  <span
                    lang="ur"
                    dir="rtl"
                    className="urdu mt-2 block text-lg text-paper/65 sm:text-xl"
                  >
                    {line.urdu}
                  </span>
                </p>
              ))}
            </blockquote>

            <figcaption className="mt-10 text-[0.65rem] tracking-[0.28em] text-gold-light uppercase">
              {iqbalQuote.attribution}
            </figcaption>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The ghazal this couplet opens - "Sitaron se aage" - is usually rendered
 * "Beyond the stars", so the section keeps a quiet sky behind the text.
 *
 * Positioned with CSS percentages rather than an SVG viewBox: stretching a
 * square viewBox across a wide viewport turns every circle into an oval, and
 * these have to stay round at any aspect ratio.
 */
function Stars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {STARS.map((star) => (
        <span
          key={`${star.x}-${star.y}`}
          className="iqbal-star absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.r * 2.5}px`,
            height: `${star.r * 2.5}px`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function Bird({ strokeWidth }: { strokeWidth: number }) {
  return (
    <svg viewBox="0 0 60 24" className="iqbal-bird block h-auto w-full">
      <path
        className="iqbal-wing iqbal-wing-l"
        d="M30,12 Q15,0 0,12"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        className="iqbal-wing iqbal-wing-r"
        d="M30,12 Q45,0 60,12"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
