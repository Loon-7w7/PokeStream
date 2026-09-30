"use client";
// Modal de confirmación para acciones importantes. El botón de confirmar puede ir dentro de un
// <form action> (p. ej. cerrar sesión) pasando `formAction`.
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { cx } from "./cx";
import { Modal } from "./Modal";

const TONES = {
  danger: "bg-bad text-white",
  warn: "bg-warn text-bg",
  accent: "bg-accent text-bg",
} as const;

export function ConfirmDialog(props: {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  pending?: boolean;
  onConfirm?: () => void;
  /** Server action a la que envía el botón de confirmar (en vez de `onConfirm`). */
  formAction?: () => void | Promise<void>;
  onClose: () => void;
}) {
  const { icon: Icon, tone = "danger", pending = false } = props;
  const confirm = (
    <button
      type={props.formAction ? "submit" : "button"}
      onClick={props.onConfirm}
      disabled={pending}
      className={cx("inline-flex items-center gap-1.5 rounded-lg px-4 py-2 font-semibold hover:brightness-110 disabled:opacity-50", TONES[tone])}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {props.confirmLabel}
    </button>
  );

  return (
    <Modal title={props.title} onClose={props.onClose}>
      <div className="grid gap-3 text-sm">{props.children}</div>
      <div className="mt-5 flex justify-end gap-2 text-sm">
        <button onClick={props.onClose} autoFocus className="rounded-lg border border-line px-4 py-2">
          Cancelar
        </button>
        {props.formAction ? <form action={props.formAction}>{confirm}</form> : confirm}
      </div>
    </Modal>
  );
}
