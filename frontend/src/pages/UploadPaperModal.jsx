import React, { useState } from 'react';
import './UploadPaperModal.css';

const UploadPaperModal = ({ isOpen, onClose, onConfirm }) => {
  const [paperId, setPaperId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paperDetails, setPaperDetails] = useState(null);
  const [error, setError] = useState('');

  const handleFetchPaper = async () => {
    if (!paperId.trim()) {
      setError('Please enter a Paper ID, DOI, or ArXiv ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setPaperDetails(null);

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://localhost:5000/api/papers/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paperId: paperId.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch paper details');
      }

      const data = await response.json();
      
      // Transform the API response to match our component structure
      setPaperDetails({
        s2_paper_id: data.s2_paper_id,
        title: data.title,
        authors: data.authors || [],
        published_year: data.published_year,
        citation_count: data.citation_count || 0,
        fields_of_study: data.fields_of_study || [],
        venue: data.venue || null,
        abstract: data.abstract || null,
        doi: data.doi || null,
        arxiv_id: data.arxiv_id || null,
        is_open_access: data.is_open_access || false,
        pdf_url: data.pdf_url || null,
        publication_date: data.publication_date || null
      });

    } catch (err) {
      console.error('Error fetching paper:', err);
      setError(err.message || 'Failed to fetch paper details. Please check the ID and try again.');
      setPaperDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!paperDetails) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://localhost:5000/api/papers/publications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          s2_paper_id: paperDetails.s2_paper_id,
          title: paperDetails.title,
          published_year: paperDetails.published_year,
          citation_count: paperDetails.citation_count,
          fields_of_study: paperDetails.fields_of_study
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add paper to publications');
      }

      const result = await response.json();
      console.log('Paper added successfully:', result);

      // Call the parent's onConfirm with the paper details
      await onConfirm(paperDetails);
      
      // Close modal and reset
      handleClose();
      
    } catch (err) {
      console.error('Error adding paper:', err);
      setError(err.message || 'Failed to add paper. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPaperId('');
    setPaperDetails(null);
    setError('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleFetchPaper();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">Upload Paper</h2>
          <button className="upload-modal-close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="upload-modal-body">
          {/* Input Section */}
          <div className="upload-input-section">
            <label className="upload-label">Enter Paper ID, DOI, or ArXiv ID</label>
            <div className="upload-input-group">
              <input
                type="text"
                className="upload-input"
                value={paperId}
                onChange={(e) => setPaperId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 10.1038/nature12345 or 2401.12345"
                disabled={isLoading}
              />
              <button
                className="upload-fetch-btn"
                onClick={handleFetchPaper}
                disabled={isLoading}
              >
                {isLoading && !paperDetails ? (
                  <>
                    <span className="upload-spinner"></span>
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    Fetch Details
                  </>
                )}
              </button>
            </div>
            {error && <div className="upload-error">{error}</div>}
            <p className="upload-help-text">
              Supports Semantic Scholar Paper ID, DOI, or ArXiv ID
            </p>
          </div>

          {/* Paper Details Section */}
          {paperDetails && (
            <div className="paper-preview-section">
              <h3 className="preview-section-title">Paper Preview</h3>
              
              <div className="paper-preview-card">
                {/* Title */}
                <h4 className="paper-preview-title">{paperDetails.title}</h4>

                {/* Authors */}
                {paperDetails.authors && paperDetails.authors.length > 0 && (
                  <div className="paper-preview-authors">
                    {paperDetails.authors.join(', ')}
                  </div>
                )}

                {/* Metadata Row */}
                <div className="paper-preview-meta">
                  {paperDetails.published_year && (
                    <span className="meta-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {paperDetails.published_year}
                    </span>
                  )}
                  
                  <span className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Cited by {paperDetails.citation_count}
                  </span>

                  {paperDetails.venue && (
                    <span className="meta-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                      {paperDetails.venue}
                    </span>
                  )}
                </div>

                {/* Fields of Study */}
                {paperDetails.fields_of_study && paperDetails.fields_of_study.length > 0 && (
                  <div className="paper-preview-fields">
                    {paperDetails.fields_of_study.map((field, idx) => (
                      <span key={idx} className="field-tag">{field}</span>
                    ))}
                  </div>
                )}

                {/* Abstract */}
                {paperDetails.abstract && (
                  <div className="paper-preview-abstract">
                    <strong>Abstract:</strong>
                    <p>{paperDetails.abstract}</p>
                  </div>
                )}

                {/* External IDs */}
                <div className="paper-preview-ids">
                  {paperDetails.doi && (
                    <div className="id-item">
                      <strong>DOI:</strong> {paperDetails.doi}
                    </div>
                  )}
                  {paperDetails.arxiv_id && (
                    <div className="id-item">
                      <strong>ArXiv:</strong> {paperDetails.arxiv_id}
                    </div>
                  )}
                  {paperDetails.is_open_access && (
                    <div className="id-item open-access">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      Open Access
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {paperDetails && (
          <div className="upload-modal-footer">
            <button
              className="upload-btn-cancel"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="upload-btn-confirm"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="upload-spinner"></span>
                  Adding...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Confirm & Add to Publications
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPaperModal;