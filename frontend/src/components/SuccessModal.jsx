import React, { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function SuccessModal({ message }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setVisible(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [message]);

  if (!message || !visible) return null;

  const close = () => setVisible(false);

  return (
    <div
      className="success-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className="success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-message"
      >
        <button
          type="button"
          className="success-modal-close"
          onClick={close}
          aria-label="Close success message"
        >
          <X size={18} />
        </button>
        <div className="success-modal-icon" aria-hidden="true">
          <CheckCircle2 size={34} strokeWidth={2.2} />
        </div>
        <h2 id="success-modal-title">Success</h2>
        <p id="success-modal-message">{message}</p>
        <button type="button" className="primary-button success-modal-button" onClick={close}>
          Done
        </button>
      </div>
    </div>
  );
}
