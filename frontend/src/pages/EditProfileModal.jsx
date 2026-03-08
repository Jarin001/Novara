import React, { useState } from 'react';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose, userData, onSave }) => {
  const [formData, setFormData] = useState({
    name: userData.name || '',
    affiliation: userData.affiliation || '',
    email: userData.email || '',
    researchInterests: userData.researchInterests || [],
    socialLinks: userData.socialLinks || [] // Add socialLinks
  });
  const [newInterest, setNewInterest] = useState('');
  const [newSocialLink, setNewSocialLink] = useState('');
  const [socialLinkError, setSocialLinkError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.researchInterests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        researchInterests: [...formData.researchInterests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      researchInterests: formData.researchInterests.filter(i => i !== interest)
    });
  };

  // Validate URL
  const isValidUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Add social link
  const handleAddSocialLink = () => {
    setSocialLinkError('');
    
    if (!newSocialLink.trim()) {
      return;
    }

    if (!isValidUrl(newSocialLink)) {
      setSocialLinkError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    if (!formData.socialLinks.includes(newSocialLink.trim())) {
      setFormData({
        ...formData,
        socialLinks: [...formData.socialLinks, newSocialLink.trim()]
      });
      setNewSocialLink('');
    }
  };

  // Remove social link
  const handleRemoveSocialLink = (link) => {
    setFormData({
      ...formData,
      socialLinks: formData.socialLinks.filter(l => l !== link)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input form-input-readonly"
              value={formData.email}
              disabled
            />
            <small className="form-help-text">Email cannot be changed</small>
          </div>

          {/* Affiliation */}
          <div className="form-group">
            <label className="form-label">Affiliation / Institution</label>
            <input
              type="text"
              name="affiliation"
              className="form-input"
              value={formData.affiliation}
              onChange={handleChange}
              placeholder="e.g., Islamic University of Technology"
            />
          </div>

          {/* Social Links - NEW SECTION */}
          <div className="form-group">
            <label className="form-label">Social Links</label>
            <div className="interest-input-group">
              <input
                type="url"
                className="form-input"
                value={newSocialLink}
                onChange={(e) => {
                  setNewSocialLink(e.target.value);
                  setSocialLinkError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSocialLink())}
                placeholder="https://github.com/username"
              />
              <button 
                type="button" 
                className="add-interest-btn"
                onClick={handleAddSocialLink}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            {socialLinkError && (
              <small className="form-error-text">{socialLinkError}</small>
            )}
            <small className="form-help-text">
              Add links to GitHub, LinkedIn, Twitter, Google Scholar, etc.
            </small>
            
            {formData.socialLinks.length > 0 && (
              <div className="interests-list" style={{ marginTop: '12px' }}>
                {formData.socialLinks.map((link, idx) => (
                  <span key={idx} className="interest-tag">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Simple icon based on URL */}
                      {link.includes('github') && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                        </svg>
                      )}
                      {link.includes('linkedin') && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z"/>
                        </svg>
                      )}
                      {link.includes('twitter') || link.includes('x.com') ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      ) : link.includes('scholar') && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7v2l10 5 10-5V7l-10-5zm0 4.2L5.5 7 12 9.8 18.5 7 12 6.2zM4 12v5l8 4 8-4v-5l-8 4-8-4z"/>
                        </svg>
                      )}
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'white', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.split('/')[2]?.replace('www.', '') || link}
                      </a>
                    </span>
                    <button
                      type="button"
                      className="remove-interest-btn"
                      onClick={() => handleRemoveSocialLink(link)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Research Interests */}
          <div className="form-group">
            <label className="form-label">Research Interests</label>
            <div className="interest-input-group">
              <input
                type="text"
                className="form-input"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                placeholder="Add research interest"
              />
              <button 
                type="button" 
                className="add-interest-btn"
                onClick={handleAddInterest}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            
            {formData.researchInterests.length > 0 && (
              <div className="interests-list">
                {formData.researchInterests.map((interest, idx) => (
                  <span key={idx} className="interest-tag">
                    {interest}
                    <button
                      type="button"
                      className="remove-interest-btn"
                      onClick={() => handleRemoveInterest(interest)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;