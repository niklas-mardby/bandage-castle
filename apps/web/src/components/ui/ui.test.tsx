// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Badge, StatusBadge } from './Badge'
import { Button } from './Button'
import { ConfirmModal, Modal } from './Modal'
import { Tabs } from './Tabs'
import { EmptyState, ErrorMessage } from './Feedback'
import { TextInput } from './Field'

afterEach(cleanup)

describe('Badge', () => {
  it('colours statuses consistently', () => {
    render(<StatusBadge status="CHECKED_IN" />)
    expect(screen.getByText('checked in').className).toContain('ui-badge-ok')
  })

  it('renders nothing without a status', () => {
    const { container } = render(<StatusBadge status={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('takes an explicit tone', () => {
    render(<Badge tone="danger">escaped</Badge>)
    expect(screen.getByText('escaped').className).toContain('ui-badge-danger')
  })
})

describe('Button', () => {
  it('is disabled while loading', () => {
    render(<Button loading>Save</Button>)
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('Modal', () => {
  it('is not rendered when closed', () => {
    render(
      <Modal open={false} title="Hello" onClose={() => {}}>
        body
      </Modal>,
    )
    expect(screen.queryByText('Hello')).toBeNull()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal open title="Hello" onClose={onClose}>
        body
      </Modal>,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('ConfirmModal calls onConfirm', () => {
    const onConfirm = vi.fn()
    render(<ConfirmModal open title="Void?" message="Sure?" onConfirm={onConfirm} onCancel={() => {}} confirmLabel="Void it" />)
    fireEvent.click(screen.getByText('Void it'))
    expect(onConfirm).toHaveBeenCalled()
  })
})

describe('Tabs', () => {
  it('reports the clicked tab and shows counts', () => {
    const onChange = vi.fn()
    render(
      <Tabs
        active="a"
        onChange={onChange}
        tabs={[
          { key: 'a', label: 'Stays', count: 3 },
          { key: 'b', label: 'Invoices' },
        ]}
      />,
    )
    expect(screen.getByText('3')).toBeTruthy()
    fireEvent.click(screen.getByText('Invoices'))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('feedback', () => {
  it('shows an empty state', () => {
    render(<EmptyState title="No dragons" />)
    expect(screen.getByText('No dragons')).toBeTruthy()
  })

  it('shows error messages from Error objects', () => {
    render(<ErrorMessage error={new Error('The slime ate it')} />)
    expect(screen.getByRole('alert').textContent).toContain('The slime ate it')
  })
})

describe('TextInput', () => {
  it('shows the error instead of the hint', () => {
    render(<TextInput label="Email" hint="we never spam" error="Not an email" value="" onChange={() => {}} />)
    expect(screen.getByText('Not an email')).toBeTruthy()
    expect(screen.queryByText('we never spam')).toBeNull()
  })
})
