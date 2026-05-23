import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="primary" size="md">Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button variant="primary" size="md" onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button variant="primary" size="md" disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<Button variant="primary" size="md" disabled onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows spinner and hides children when loading', async () => {
    const onClick = vi.fn()
    render(<Button variant="primary" size="md" loading onClick={onClick}>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
    expect(button.querySelector('[data-testid="spinner"]') || button.querySelector('span')).toBeTruthy()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('hides leftIcon when loading', () => {
    render(
      <Button variant="primary" size="md" loading leftIcon={<span data-testid="icon" />}>
        Click
      </Button>
    )
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
  })

  it('renders as submit button when type is submit', () => {
    render(<Button variant="primary" size="md" type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('renders leftIcon when provided', () => {
    render(<Button variant="primary" size="md" leftIcon={<span data-testid="icon" />}>Click</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('applies primary variant styles', () => {
    render(<Button variant="primary" size="md">Click</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveStyle({ backgroundColor: 'rgb(11, 206, 131)', color: 'rgb(255, 255, 255)' })
  })

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary" size="md">Click</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ color: 'rgb(11, 206, 131)' })
  })

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost" size="md">Click</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ color: 'rgb(149, 140, 168)' })
  })

  it('applies sm size height', () => {
    render(<Button variant="primary" size="sm">Click</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ height: '32px' })
  })

  it('applies lg size height', () => {
    render(<Button variant="primary" size="lg">Click</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ height: '56px' })
  })
})
