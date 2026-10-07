"use client";

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function AdminSubmitButton(props: ComponentProps<"button">) {
  const { pending } = useFormStatus();
  const { children, disabled, ...buttonProps } = props;

  return (
    <button {...buttonProps} type={props.type ?? "submit"} disabled={disabled || pending}>
      {pending && <span className="admin-button-spinner" aria-hidden="true" />}
      {pending ? "Working…" : children}
    </button>
  );
}

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

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

export function ExportInvitationButton({ inviteeName, invitedBy }: { inviteeName: string; invitedBy?: string }) {
  const [exporting, setExporting] = useState(false);

  const exportInvitation = async () => {
    setExporting(true);
    try {
      await document.fonts.ready;
      const [background, logo] = await Promise.all([loadImage("/img/invbg.png"), loadImage("/img/logo.png")]);
      const canvas = document.createElement("canvas");
      canvas.width = 1131;
      canvas.height = 1600;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");

      const styles = getComputedStyle(document.documentElement);
      const displayFont = styles.getPropertyValue("--font-playfair").trim() || "Georgia";
      const scriptFont = styles.getPropertyValue("--font-cormorant").trim() || "Georgia";
      const sansFont = styles.getPropertyValue("--font-josefin").trim() || "sans-serif";
      const ink = "#4a2d0f";
      const gold = "#b88742";
      const center = canvas.width / 2;
      const write = (text: string, y: number, size: number, family = scriptFont, style = "", maxWidth = 760) => {
        context.font = `${style}${size}px ${family}`;
        while (context.measureText(text).width > maxWidth && size > 24) context.font = `${style}${--size}px ${family}`;
        context.fillText(text, center, y);
      };

      context.drawImage(background, 0, 0, canvas.width, canvas.height);
      context.fillStyle = ink;
      context.textAlign = "center";
      context.textBaseline = "middle";

      const hosts = invitedBy?.split(/,\s*/).filter(Boolean) ?? [];
      hosts.forEach((host, index) => write(`${host}${index < hosts.length - 1 ? "," : ""}`, 225 + index * 52, 42, displayFont, "", 720));
      write(invitedBy ? "request the pleasure of the company of" : "Hiruni & Ravindu request the pleasure of the company of", hosts.length ? 225 + hosts.length * 52 + 30 : 280, 34);

      const nameY = hosts.length ? 225 + hosts.length * 52 + 130 : 390;
      context.strokeStyle = gold;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(270, nameY - 55);
      context.lineTo(861, nameY - 55);
      context.moveTo(270, nameY + 55);
      context.lineTo(861, nameY + 55);
      context.stroke();
      write(inviteeName, nameY, 58, scriptFont, "italic ", 550);

      write("to celebrate the marriage of", nameY + 130, 34);
      write("Hiruni   &   Ravindu", nameY + 235, 76, displayFont, "", 800);

      const dateY = nameY + 390;
      context.textAlign = "right";
      context.font = `300 25px ${sansFont}`;
      context.fillText("DECEMBER", center - 85, dateY);
      context.textAlign = "center";
      context.font = `400 92px ${displayFont}`;
      context.fillText("2", center, dateY);
      context.strokeStyle = gold;
      context.beginPath();
      context.moveTo(center - 62, dateY - 50);
      context.lineTo(center - 62, dateY + 50);
      context.moveTo(center + 62, dateY - 50);
      context.lineTo(center + 62, dateY + 50);
      context.stroke();
      context.textAlign = "left";
      context.font = `300 23px ${sansFont}`;
      context.fillText("WEDNESDAY", center + 85, dateY - 18);
      context.fillText("2026", center + 85, dateY + 22);
      context.textAlign = "center";

      write("9:30 in the morning   until   3:30 in the afternoon", dateY + 115, 30);
      write("AT", dateY + 235, 20, sansFont);
      write("The Grand Kandyan Hotel", dateY + 300, 43, displayFont);
      write("Kandy, Sri Lanka", dateY + 355, 31);

      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = 130;
      logoCanvas.height = 139;
      const logoContext = logoCanvas.getContext("2d");
      if (logoContext) {
        logoContext.drawImage(logo, 0, 0, logoCanvas.width, logoCanvas.height);
        logoContext.globalCompositeOperation = "source-in";
        logoContext.fillStyle = ink;
        logoContext.fillRect(0, 0, logoCanvas.width, logoCanvas.height);
        context.drawImage(logoCanvas, center - 65, dateY + 395);
      }

      const link = document.createElement("a");
      link.download = `${inviteeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wedding-invitation"}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.94);
      link.click();
    } finally {
      setExporting(false);
    }
  };

  return <button className="admin-copy-button" type="button" onClick={exportInvitation} disabled={exporting}>{exporting ? "Exporting…" : "Export JPG"}</button>;
}
