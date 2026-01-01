import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('renders primary variant correctly', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
    });

    it('renders success variant correctly', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('renders warning variant correctly', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('renders danger variant correctly', () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText('Danger');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('uses default variant when not specified', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('renders medium size correctly', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm');
    });

    it('uses small size by default', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });
  });

  describe('Base Styling', () => {
    it('has inline-flex display', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge).toHaveClass('inline-flex');
    });

    it('has items-center class', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge).toHaveClass('items-center');
    });

    it('has font-medium class', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge).toHaveClass('font-medium');
    });

    it('has rounded-full class (pill shape)', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('Use Cases', () => {
    it('can display status text', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('can display count', () => {
      render(<Badge variant="primary">42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('can display category label', () => {
      render(<Badge variant="default">Category</Badge>);
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });

  describe('Variant Color Scheme', () => {
    it('default variant has gray color scheme', () => {
      render(<Badge variant="default">Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.className).toContain('gray');
    });

    it('success variant has green color scheme', () => {
      render(<Badge variant="success">Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.className).toContain('green');
    });

    it('warning variant has yellow color scheme', () => {
      render(<Badge variant="warning">Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.className).toContain('yellow');
    });

    it('danger variant has red color scheme', () => {
      render(<Badge variant="danger">Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.className).toContain('red');
    });
  });
});
