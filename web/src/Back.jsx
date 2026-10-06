import React from 'react';
import { useNavigate } from 'react-router-dom';

// Shared on-brand back button for easy reach (history back).
export default function Back() {
  const navigate = useNavigate();
  return (
    <button className="btn btn-secondary" style={{ height: 40, marginBottom: 12 }} onClick={() => navigate(-1)}>
      ‹ Back
    </button>
  );
}
