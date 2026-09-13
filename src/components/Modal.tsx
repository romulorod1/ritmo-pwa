import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

export const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) => {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-sheet__handle" />
        <header className="modal-sheet__header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <Icon name="close" />
          </button>
        </header>
        <div className="modal-sheet__content">{children}</div>
      </section>
    </div>
  )
}

