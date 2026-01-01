import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader } from '../Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card.tagName).toBe('DIV');
    });
  });

  describe('Styling', () => {
    it('has white background', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('bg-white');
    });

    it('has rounded corners', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('rounded-xl');
    });

    it('has shadow styling', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('shadow-sm');
    });

    it('has border styling', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('border', 'border-gray-200');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('custom-class');
    });

    it('combines default and custom className', () => {
      render(<Card className="my-custom">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('bg-white', 'rounded-xl', 'my-custom');
    });
  });

  describe('Padding Variants', () => {
    it('applies no padding when padding="none"', () => {
      render(<Card padding="none">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).not.toHaveClass('p-4', 'p-6', 'p-8');
    });

    it('applies small padding (p-4) when padding="sm"', () => {
      render(<Card padding="sm">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('p-4');
    });

    it('applies medium padding (p-6) by default', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('p-6');
    });

    it('applies medium padding (p-6) when padding="md"', () => {
      render(<Card padding="md">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('p-6');
    });

    it('applies large padding (p-8) when padding="lg"', () => {
      render(<Card padding="lg">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('Nested Content', () => {
    it('renders nested elements correctly', () => {
      render(
        <Card>
          <div data-testid="nested">Nested content</div>
        </Card>
      );
      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <Card>
          <span>First</span>
          <span>Second</span>
        </Card>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });
});

describe('CardHeader Component', () => {
  describe('Rendering', () => {
    it('renders title', () => {
      render(<CardHeader title="Card Title" />);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('title is rendered as h3', () => {
      render(<CardHeader title="Card Title" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Card Title');
    });

    it('renders subtitle when provided', () => {
      render(<CardHeader title="Title" subtitle="Subtitle text" />);
      expect(screen.getByText('Subtitle text')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      render(<CardHeader title="Title" />);
      const paragraphs = document.querySelectorAll('p');
      expect(paragraphs.length).toBe(0);
    });

    it('renders action when provided', () => {
      render(
        <CardHeader
          title="Title"
          action={<button>Action</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('title has correct styling', () => {
      render(<CardHeader title="Title" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
    });

    it('subtitle has correct styling', () => {
      render(<CardHeader title="Title" subtitle="Subtitle" />);
      const subtitle = screen.getByText('Subtitle');
      expect(subtitle).toHaveClass('text-sm', 'text-gray-500');
    });

    it('has flex layout', () => {
      render(<CardHeader title="Title" />);
      const header = screen.getByRole('heading', { level: 3 }).closest('div')?.parentElement;
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('has bottom margin', () => {
      render(<CardHeader title="Title" />);
      const header = screen.getByRole('heading', { level: 3 }).closest('div')?.parentElement;
      expect(header).toHaveClass('mb-4');
    });
  });

  describe('Layout', () => {
    it('places title and subtitle on the left, action on the right', () => {
      render(
        <CardHeader
          title="Title"
          subtitle="Subtitle"
          action={<button>Action</button>}
        />
      );
      const header = screen.getByRole('heading', { level: 3 }).closest('div')?.parentElement;
      expect(header).toHaveClass('flex', 'justify-between');
    });
  });
});
