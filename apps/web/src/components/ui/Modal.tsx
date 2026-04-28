import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, footer }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div className="ui-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="ui-modal-header">
          <h3>{title}</h3>
          <button className="ui-modal-close" onClick={onClose} aria-label="Close">
            ✖
          </button>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </div>
    </div>
  )
}

/** "Are you sure?" with a castle twist. */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Yes, do it',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {message}
    </Modal>
  )
}
