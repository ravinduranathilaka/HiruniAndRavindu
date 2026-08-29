"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export function AdminModal({ label = "Edit", title, children }: { label?: string; title: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button className="admin-edit-button" type="button" onClick={() => dialog.current?.showModal()}>{label}</button>
      <dialog ref={dialog} className="admin-dialog" aria-labelledby={titleId} onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}>
        <div className="admin-dialog-card">
          <header><h2 id={titleId}>{title}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Close">×</button></header>
          {children}
        </div>
      </dialog>
    </>
  );
}

export function CopyInvitationLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(new URL(url, window.location.origin).href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return <button className="admin-copy-button" type="button" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>;
}
