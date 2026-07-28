// SearchResults.test.js

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchResults from '../pages/SearchResults';

// ── Mock react-router-dom hooks used by the component ──
const mockNavigate = jest.fn();
let mockSearchParams = '';

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ search: mockSearchParams }),
  useNavigate: () => mockNavigate,
}), { virtual: true });
// ── Mock Navbar so its own dependencies don't interfere ──
jest.mock('../components/Navbar', () => () => <div data-testid="mock-navbar" />);

// ── Mock API endpoint config ──
jest.mock('../config/api', () => ({
  API_ENDPOINTS: {
    AUTOCOMPLETE: 'http://mock-api/autocomplete',
    AUTHOR_AUTOCOMPLETE: 'http://mock-api/author-autocomplete',
  },
}));

beforeEach(() => {
  mockSearchParams = '';
  mockNavigate.mockClear();
  jest.useFakeTimers({ advanceTimers: true });
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ matches: [] }) })
  );
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('Renders the Novara heading', () => {
  render(<SearchResults />);
  expect(screen.getByText('Welcome to Novara')).toBeInTheDocument();
});

test('Renders the search input with publications placeholder by default', () => {
  render(<SearchResults />);
  expect(screen.getByPlaceholderText('Search for articles...')).toBeInTheDocument();
});

test('Renders the Search submit button', () => {
  render(<SearchResults />);
  expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
});

test('Renders Publications and Authors toggle buttons', () => {
  render(<SearchResults />);
  expect(screen.getByRole('button', { name: 'Publications' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Authors' })).toBeInTheDocument();
});

test('Publications button is active by default', () => {
  render(<SearchResults />);
  const button = screen.getByRole('button', { name: 'Publications' });
  expect(button).toHaveStyle('border: 2px solid #3E513E');
});

test('Typing in the search box updates its value', async () => {
  render(<SearchResults />);
  const input = screen.getByPlaceholderText('Search for articles...');

  await userEvent.type(input, 'machine learning');

  expect(input).toHaveValue('machine learning');
});

test('Clicking Authors switches the placeholder text', async () => {
  render(<SearchResults />);
  const authorsButton = screen.getByRole('button', { name: 'Authors' });

  await userEvent.click(authorsButton);

  expect(screen.getByPlaceholderText('Search for authors...')).toBeInTheDocument();
});

test('Submitting the search form navigates to the search results page', async () => {
  render(<SearchResults />);
  const input = screen.getByPlaceholderText('Search for articles...');
  const button = screen.getByRole('button', { name: 'Search' });

  await userEvent.type(input, 'deep learning');
  await userEvent.click(button);

  expect(mockNavigate).toHaveBeenCalledWith('/search?q=deep%20learning&type=publications');
});

test('Submitting an authors search navigates to the authors page', async () => {
  render(<SearchResults />);
  const authorsButton = screen.getByRole('button', { name: 'Authors' });
  await userEvent.click(authorsButton);

  const input = screen.getByPlaceholderText('Search for authors...');
  const button = screen.getByRole('button', { name: 'Search' });

  await userEvent.type(input, 'Alan Turing');
  await userEvent.click(button);

  expect(mockNavigate).toHaveBeenCalledWith('/authors?q=Alan%20Turing');
});

test('Fetches publication suggestions after typing and waiting', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ matches: [{ title: 'Attention Is All You Need', paperId: 'p1' }] }),
  });

  render(<SearchResults />);
  const input = screen.getByPlaceholderText('Search for articles...');

  await userEvent.type(input, 'attention');
  jest.advanceTimersByTime(1000);

  await waitFor(() => {
    expect(screen.getByText('Attention Is All You Need')).toBeInTheDocument();
  });
});

test('Fetches author suggestions when Authors tab is active', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        authors: [{ id: 'a1', name: 'Ada Lovelace', affiliation: 'Analytical Engine Lab' }],
      }),
  });

  render(<SearchResults />);
  await userEvent.click(screen.getByRole('button', { name: 'Authors' }));

  const input = screen.getByPlaceholderText('Search for authors...');
  await userEvent.type(input, 'ada');
  jest.advanceTimersByTime(1000);

  await waitFor(() => {
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Analytical Engine Lab')).toBeInTheDocument();
  });
});

test('Clicking a publication suggestion navigates to its paper details page', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ matches: [{ title: 'Attention Is All You Need', paperId: 'p1' }] }),
  });

  render(<SearchResults />);
  const input = screen.getByPlaceholderText('Search for articles...');

  await userEvent.type(input, 'attention');
  jest.advanceTimersByTime(1000);

  const suggestion = await screen.findByText('Attention Is All You Need');
  await userEvent.click(suggestion);

  expect(mockNavigate).toHaveBeenCalledWith('/paper/p1');
});

test('Clicking an author suggestion navigates to their profile page', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ authors: [{ id: 'a1', name: 'Ada Lovelace' }] }),
  });

  render(<SearchResults />);
  await userEvent.click(screen.getByRole('button', { name: 'Authors' }));

  const input = screen.getByPlaceholderText('Search for authors...');
  await userEvent.type(input, 'ada');
  jest.advanceTimersByTime(1000);

  const suggestion = await screen.findByText('Ada Lovelace');
  await userEvent.click(suggestion);

  expect(mockNavigate).toHaveBeenCalledWith('/profile/a1');
});

test('Shows loading text while suggestions are being fetched', async () => {
  let resolveFetch;
  global.fetch.mockReturnValueOnce(
    new Promise((resolve) => { resolveFetch = resolve; })
  );

  render(<SearchResults />);
  const input = screen.getByPlaceholderText('Search for articles...');

  await userEvent.type(input, 'neural');
  jest.advanceTimersByTime(1000);

  expect(await screen.findByText('Loading publication suggestions...')).toBeInTheDocument();

  resolveFetch({ ok: true, json: () => Promise.resolve({ matches: [] }) });
});

test('Does not fetch suggestions when query is shorter than 2 characters', async () => {
  render(<SearchResults />);
  const input = screen.getByPlaceholderText('Search for articles...');

  await userEvent.type(input, 'a');
  jest.advanceTimersByTime(1000);

  expect(global.fetch).not.toHaveBeenCalled();
});

test('Clicking outside the search box closes the suggestions dropdown', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ matches: [{ title: 'Some Paper', paperId: 'p2' }] }),
  });

  render(<SearchResults />);
  const input = screen.getByPlaceholderText('Search for articles...');

  await userEvent.type(input, 'some');
  jest.advanceTimersByTime(1000);

  await screen.findByText('Some Paper');

  fireEvent.mouseDown(document.body);

  await waitFor(() => {
    expect(screen.queryByText('Some Paper')).not.toBeInTheDocument();
  });
});