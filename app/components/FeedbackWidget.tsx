"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

const MAX_LENGTH = 500;
const MIN_LENGTH = 10;
const LAST_SENT_KEY = "localplate_feedback_last";
const POSITION_KEY = "localplate_feedback_position";
const EDGE = 8;
const DRAG_THRESHOLD = 6;
const KEY_STEP = 16;
const BUTTON_HEIGHT = 44;

type Position = { x: number; y: number };

// Keeps the button fully inside the visible screen.
function clampPosition(
  position: Position,
  width: number,
  height: number
): Position {
  const maxX = Math.max(EDGE, window.innerWidth - width - EDGE);
  const maxY = Math.max(EDGE, window.innerHeight - height - EDGE);

  return {
    x: Math.min(Math.max(position.x, EDGE), maxX),
    y: Math.min(Math.max(position.y, EDGE), maxY),
  };
}

function savePosition(position: Position) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  } catch {
    // Ignore storage problems.
  }
}

type FeedbackType = "feature" | "problem" | "other";

const TYPES: { id: FeedbackType; key: TranslationKey }[] = [
  { id: "feature", key: "fb.type.feature" },
  { id: "problem", key: "fb.type.problem" },
  { id: "other", key: "fb.type.other" },
];

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm";

export default function FeedbackWidget() {
  const { t, lang, currency } = useI18n();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feature");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [notice, setNotice] = useState("");

  // null = default corner. Once moved, the button keeps its own spot.
  const [position, setPosition] = useState<Position | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const movedRef = useRef(false);

  // Know who is writing (optional) when the panel opens.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        setUserId(user?.id ?? null);
        setUserEmail(user?.email ?? "");
      } catch {
        // Anonymous feedback is fine.
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Restore the position the visitor chose, and keep it on screen.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(POSITION_KEY) || "null"
        );

        if (
          saved &&
          typeof saved.x === "number" &&
          typeof saved.y === "number"
        ) {
          const button = buttonRef.current;

          setPosition(
            clampPosition(
              saved,
              button?.offsetWidth ?? BUTTON_HEIGHT,
              button?.offsetHeight ?? BUTTON_HEIGHT
            )
          );
        }
      } catch {
        // Ignore storage problems.
      }
    });

    const onResize = () => {
      const button = buttonRef.current;

      setPosition((current) =>
        current
          ? clampPosition(
              current,
              button?.offsetWidth ?? BUTTON_HEIGHT,
              button?.offsetHeight ?? BUTTON_HEIGHT
            )
          : current
      );
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Lets other pages (e.g. Contact) open this panel.
  useEffect(() => {
    const openPanel = () => setOpen(true);

    window.addEventListener("localplate:open-feedback", openPanel);
    return () =>
      window.removeEventListener("localplate:open-feedback", openPanel);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
    };

    movedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;

    if (!drag) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
      return;
    }

    movedRef.current = true;

    setPosition(
      clampPosition(
        { x: drag.originX + dx, y: drag.originY + dy },
        event.currentTarget.offsetWidth,
        event.currentTarget.offsetHeight
      )
    );
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;

    dragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer was already released.
    }

    if (drag && movedRef.current) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      savePosition(
        clampPosition(
          { x: drag.originX + dx, y: drag.originY + dy },
          event.currentTarget.offsetWidth,
          event.currentTarget.offsetHeight
        )
      );
    }
  }

  // Keyboard users: Shift + arrow keys move the button.
  function onButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!event.shiftKey) return;

    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };

    const step = steps[event.key];

    if (!step) return;

    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();

    const next = clampPosition(
      {
        x: (position?.x ?? rect.left) + step[0],
        y: (position?.y ?? rect.top) + step[1],
      },
      rect.width,
      rect.height
    );

    setPosition(next);
    savePosition(next);
  }

  // Opens the panel next to wherever the button currently is.
  function panelPlacement(): React.CSSProperties | undefined {
    if (!position) return undefined;

    const panelWidth = Math.min(352, window.innerWidth - 32);

    const left = Math.max(
      16,
      Math.min(position.x, window.innerWidth - panelWidth - 16)
    );

    if (position.y > window.innerHeight / 2) {
      return { left, bottom: window.innerHeight - position.y + EDGE };
    }

    return { left, top: position.y + BUTTON_HEIGHT + EDGE };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Bots fill the hidden field. Pretend it worked.
    if (trap) {
      setStatus("sent");
      return;
    }

    const text = message.trim();

    if (text.length < MIN_LENGTH) {
      setNotice(t("fb.tooShort"));
      return;
    }

    try {
      const last = Number(localStorage.getItem(LAST_SENT_KEY) || 0);

      if (Date.now() - last < 60_000) {
        setNotice(t("fb.wait"));
        return;
      }
    } catch {
      // Ignore storage problems.
    }

    setStatus("sending");
    setNotice("");

    try {
      const supabase = createClient();

      const { error } = await supabase.from("feedback").insert({
        type,
        message: text.slice(0, MAX_LENGTH),
        email: (userEmail || email).trim().slice(0, 200) || null,
        page: pathname.slice(0, 200),
        language: lang,
        currency,
        user_id: userId,
      });

      if (error) throw error;

      try {
        localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      } catch {
        // Ignore storage problems.
      }

      setMessage("");
      setStatus("sent");
    } catch (sendError) {
      console.error("Could not send feedback:", sendError);
      setStatus("idle");
      setNotice(t("fb.error"));
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          // A drag must not also open the panel.
          if (movedRef.current) {
            movedRef.current = false;
            return;
          }

          setOpen((value) => !value);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onButtonKeyDown}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={
          position
            ? { left: position.x, top: position.y }
            : undefined
        }
        className={`fixed z-40 inline-flex h-11 cursor-grab touch-none select-none items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white shadow-lg outline-none transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-95 active:cursor-grabbing ${
          position ? "" : "bottom-4 end-4"
        }`}
      >
        {/* Grip: shows that the button can be dragged */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="-ms-1 size-3 opacity-50"
          aria-hidden="true"
        >
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M4 5h16v11H9l-5 4V5z" />
        </svg>
        <span className="hidden sm:inline">{t("fb.button")}</span>
        <span className="sr-only sm:hidden">{t("fb.button")}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-labelledby="feedback-title"
          style={panelPlacement()}
          className={`fixed z-40 max-h-[calc(100vh-6rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-xl ${
            position ? "" : "bottom-20 end-4"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="feedback-title" className="font-semibold">
              {t("fb.title")}
            </h2>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("fb.close")}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-500 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                className="size-4"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {status === "sent" ? (
            <div className="mt-4">
              <p className="text-sm text-zinc-700">{t("fb.thanks")}</p>

              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-4 h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                {t("fb.another")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3 space-y-3">
              <div
                className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1"
                role="group"
                aria-label={t("fb.typeAria")}
              >
                {TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    aria-pressed={type === item.id}
                    className={`min-h-9 rounded-md px-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      type === item.id
                        ? "bg-white text-orange-700 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {t(item.key)}
                  </button>
                ))}
              </div>

              <div>
                <label
                  htmlFor="feedback-message"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  {t("fb.message")}
                </label>

                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value.slice(0, MAX_LENGTH))
                  }
                  maxLength={MAX_LENGTH}
                  rows={4}
                  placeholder={t("fb.placeholder")}
                  className={`${fieldClass} resize-none py-2`}
                />

                <p className="mt-1 text-end text-xs text-zinc-400">
                  {message.length}/{MAX_LENGTH}
                </p>
              </div>

              {!userEmail && (
                <div>
                  <label
                    htmlFor="feedback-email"
                    className="mb-1.5 block text-xs font-medium text-zinc-500"
                  >
                    {t("fb.email")}
                  </label>

                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={200}
                    autoComplete="email"
                    className={`${fieldClass} h-10`}
                  />
                </div>
              )}

              {/* Hidden field for bots */}
              <input
                type="text"
                name="website"
                value={trap}
                onChange={(event) => setTrap(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              {notice && (
                <p role="alert" className="text-sm text-red-600">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="h-10 w-full rounded-lg bg-orange-600 text-sm font-semibold text-white outline-none transition hover:bg-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {status === "sending" ? t("fb.sending") : t("fb.send")}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}