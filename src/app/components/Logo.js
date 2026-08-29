"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { STUDIO } from "../data1";

export default function Logo() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Escape to close, and hold the page still behind the overlay.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock the page. Only the Y axis: body already carries overflow-x: hidden
    // from globals.css, and the padding replaces the width the vanishing
    // scrollbar frees up — without it the sticky header jumps sideways.
    const { body } = document;
    const previousOverflowY = body.style.overflowY;
    const previousPaddingRight = body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflowY = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflowY = previousOverflowY;
      body.style.paddingRight = previousPaddingRight;
      triggerRef.current?.focus(); // hand focus back to the logo
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        className="logo"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <img className="logo-mark" src={STUDIO.logo} alt="" width="36" height="36" />
        <span>
          VENOM <span className="accent">GAMING ARENA</span>
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${STUDIO.name} logo`}
            onClick={close}
          >
            {/* Clicks on the artwork itself must not fall through to the backdrop. */}
            <div className="lightbox-panel" onClick={(event) => event.stopPropagation()}>
              <button
                ref={closeRef}
                className="lightbox-close"
                type="button"
                aria-label="Close"
                onClick={close}
              >
                &times;
              </button>
              <img className="lightbox-img" src={STUDIO.logo} alt={`${STUDIO.name} logo`} />
              <p className="lightbox-caption">{STUDIO.name}</p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
