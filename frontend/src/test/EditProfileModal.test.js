// src/test/EditProfileModal.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProfileModal from '../pages/EditProfileModal'; // confirmed path from stack trace

beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  window.alert.mockRestore();
  jest.clearAllMocks();
});

const baseUserData = {
  name: 'Jane Doe',
  affiliation: 'MIT',
  email: 'jane@mit.edu',
  researchInterests: ['Machine Learning'],
  socialLinks: ['https://github.com/janedoe'],
};

// NOTE: the "add"/"remove"/close buttons are icon-only with no aria-label,
// so they can't be queried by accessible role/name. Using class selectors
// as a workaround — this itself reflects the accessibility gap noted below.
function getAddInterestButton(container) {
  return container.querySelector('.form-group:nth-of-type(4) .add-interest-btn');
}
function getAddSocialLinkButton(container) {
  return container.querySelector('.form-group:nth-of-type(3) .add-interest-btn');
}

describe('EditProfileModal', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EditProfileModal isOpen={false} userData={baseUserData} onClose={jest.fn()} onSave={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders form pre-filled with userData', () => {
    render(
      <EditProfileModal isOpen={true} userData={baseUserData} onClose={jest.fn()} onSave={jest.fn()} />
    );
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MIT')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
  });

  test('adds a new research interest', async () => {
    const { container } = render(
      <EditProfileModal isOpen={true} userData={baseUserData} onClose={jest.fn()} onSave={jest.fn()} />
    );

    const input = screen.getByPlaceholderText('Add research interest');
    await userEvent.type(input, 'Computer Vision');
    await userEvent.click(getAddInterestButton(container));

    expect(screen.getByText('Computer Vision')).toBeInTheDocument();
  });

  test('rejects an invalid social link URL', async () => {
    const { container } = render(
      <EditProfileModal isOpen={true} userData={baseUserData} onClose={jest.fn()} onSave={jest.fn()} />
    );

    const input = screen.getByPlaceholderText('https://github.com/username');
    await userEvent.type(input, 'not-a-valid-url');
    await userEvent.click(getAddSocialLinkButton(container));

    expect(
      screen.getByText('Please enter a valid URL starting with http:// or https://')
    ).toBeInTheDocument();
  });

  test('calls onSave and onClose on successful submit', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockResolvedValue();
    render(
      <EditProfileModal isOpen={true} userData={baseUserData} onClose={onClose} onSave={onSave} />
    );

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jane Doe' })
    ));
    expect(onClose).toHaveBeenCalled();
  });

  test('shows an alert and keeps modal open when onSave fails', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockRejectedValue(new Error('Network error'));
    render(
      <EditProfileModal isOpen={true} userData={baseUserData} onClose={onClose} onSave={onSave} />
    );

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  test('BUG CHECK: form does not update when userData prop changes after mount', () => {
    const { rerender } = render(
      <EditProfileModal isOpen={true} userData={{}} onClose={jest.fn()} onSave={jest.fn()} />
    );

    // Modal opened before the parent's profile fetch finished — name is blank.
    expect(screen.getByPlaceholderText('Enter your full name').value).toBe('');

    // Parent's fetch now resolves and passes the real data down — modal
    // stays mounted (isOpen is still true), only userData changes.
    rerender(
      <EditProfileModal
        isOpen={true}
        userData={baseUserData}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    // Expected: the form should now show the loaded name.
    // Actual: formData was seeded once on first render via useState() and
    // never re-synced, so the input stays empty.
    expect(screen.getByPlaceholderText('Enter your full name').value).toBe('Jane Doe');
  });

  test('BUG CHECK: whitespace-only name is submitted without validation', async () => {
    const onSave = jest.fn().mockResolvedValue();
    render(
      <EditProfileModal isOpen={true} userData={baseUserData} onClose={jest.fn()} onSave={onSave} />
    );

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '   ');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    // Expected: a whitespace-only name should be rejected the same way an
    // empty name is (HTML `required` only blocks a truly empty string, not
    // whitespace — there's no additional trim/validation in the component).
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });

  test('BUG CHECK: research interests are deduplicated case-sensitively only', async () => {
    const { container } = render(
      <EditProfileModal isOpen={true} userData={baseUserData} onClose={jest.fn()} onSave={jest.fn()} />
    );
    // baseUserData already has "Machine Learning" — try adding "machine learning"
    const input = screen.getByPlaceholderText('Add research interest');
    await userEvent.type(input, 'machine learning');
    await userEvent.click(getAddInterestButton(container));

    // Expected: treated as a duplicate of the existing "Machine Learning"
    // entry and not added again.
    const tags = container.querySelectorAll('.interest-tag');
    expect(tags.length).toBe(1);
  });
});