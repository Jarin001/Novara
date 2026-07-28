// PDFViewer.test.js

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PDFViewer from '../pages/PDFViewer';

// ── Mock react-pdf so it doesn't try to render a real PDF ──
jest.mock('react-pdf', () => {
  const React = require('react');
  return {
    Document: ({ children, onLoadSuccess }) => {
      React.useEffect(() => {
        onLoadSuccess && onLoadSuccess({ numPages: 3 });
      }, []);
      return <div data-testid="mock-document">{children}</div>;
    },
    Page: ({ onRenderSuccess }) => {
      React.useEffect(() => {
        onRenderSuccess && onRenderSuccess({ getViewport: () => ({ width: 600, height: 800 }) });
      }, []);
      return <div data-testid="mock-page">Mock PDF Page</div>;
    },
    pdfjs: { GlobalWorkerOptions: {} },
  };
});

// ── Mock socket.io-client so it doesn't open a real connection ──
jest.mock('socket.io-client', () => {
  const mSocket = { on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
  return {
    __esModule: true,
    default: jest.fn(() => mSocket),
  };
});

// ── Mock Navbar so its own dependencies don't interfere ──
jest.mock('../components/Navbar', () => () => <div data-testid="mock-navbar" />);

// ── Helper to render with router + a fake pdfUrl in location.state ──
const renderWithRouter = () => {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/pdf/paper123', state: { pdfUrl: 'http://example.com/test.pdf' } }]}
    >
      <Routes>
        <Route path="/pdf/:paperId" element={<PDFViewer />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  // Mock all fetch calls made on mount (annotations, profile pics, etc.)
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  );

  // Simulate a logged-in user
  localStorage.setItem('user', JSON.stringify({ id: 'user1', name: 'Alice' }));
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test('Renders Navbar', async () => {
  renderWithRouter();
  expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
});

test('Renders Highlight tool button', async () => {
  renderWithRouter();
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Highlight' })).toBeInTheDocument();
  });
});

test('Renders Note tool button', async () => {
  renderWithRouter();
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Note' })).toBeInTheDocument();
  });
});

test('Highlight tool is active by default', async () => {
  renderWithRouter();
  await waitFor(() => {
    const button = screen.getByRole('button', { name: 'Highlight' });
    expect(button).toHaveStyle('font-weight: 600');
  });
});

test('Clicking Note tool switches the active tool', async () => {
  renderWithRouter();
  await waitFor(() => screen.getByRole('button', { name: 'Note' }));
  const noteButton = screen.getByRole('button', { name: 'Note' });

  await userEvent.click(noteButton);

  expect(noteButton).toHaveStyle('font-weight: 600');
});

test('Clicking a tool with no selection shows a toast message', async () => {
  renderWithRouter();
  await waitFor(() => screen.getByRole('button', { name: 'Highlight' }));
  const button = screen.getByRole('button', { name: 'Highlight' });

  await userEvent.click(button);

  expect(
    await screen.findByText('Select an area on the PDF first, then click the tool.')
  ).toBeInTheDocument();
});

test('Renders page count as 1 / 3 after PDF loads', async () => {
  renderWithRouter();
  await waitFor(() => {
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});

test('Previous page button is disabled on page 1', async () => {
  renderWithRouter();
  await waitFor(() => {
    expect(screen.getByText('◀')).toBeDisabled();
  });
});

test('Next page button navigates to page 2', async () => {
  renderWithRouter();
  await waitFor(() => screen.getByText('1 / 3'));

  await userEvent.click(screen.getByText('▶'));

  expect(screen.getByText('2 / 3')).toBeInTheDocument();
});

test('Zoom in increases zoom percentage', async () => {
  renderWithRouter();
  await waitFor(() => screen.getByText('100%'));

  await userEvent.click(screen.getByText('+'));

  expect(screen.getByText('125%')).toBeInTheDocument();
});

test('Zoom out decreases zoom percentage', async () => {
  renderWithRouter();
  await waitFor(() => screen.getByText('100%'));

  await userEvent.click(screen.getByText('−'));

  expect(screen.getByText('75%')).toBeInTheDocument();
});