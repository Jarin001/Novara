import React, { useState } from 'react';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose, userData, onSave }) => {
  const [formData, setFormData] = useState({
    name: userData.name || '',
    affiliation: userData.affiliation || '',
    email: userData.email || '',
    researchInterests: userData.researchInterests || []
  });
  const [newInterest, setNewInterest] = useState('');
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