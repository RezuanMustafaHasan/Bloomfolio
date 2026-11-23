import React, { useEffect, useRef, useState } from 'react';
import { startBulkFetch, getBulkFetchProgress, stopBulkFetch } from '../services/adminBulk';

const fmtTime = (isoOrDate) => {
  if (!isoOrDate) return '—';
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleString();
};

const BulkFetch = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ total: 0, completed: 0, failed: 0, current: null, percentage: 0, startTime: null, estimatedTimeRemaining: null, errors: [] });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const pollRef = useRef(null);

  const loadProgress = async () => {
    try {
      const res = await getBulkFetchProgress();
      if (res?.success) {
        setProgress(res.data);
        setIsRunning(!!res.data?.isRunning);
      }
    } catch (_) {}
  };

  useEffect(() => {
    // Initial load
    loadProgress();
  }, []);

  useEffect(() => {
    // Poll while running
    if (isRunning) {
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(loadProgress, 2000);
      return () => pollRef.current && clearInterval(pollRef.current);
    } else {
      pollRef.current && clearInterval(pollRef.current);
    }
  }, [isRunning]);

  const onStart = async () => {
    setError('');
    setMessage('');
    try {
      const res = await startBulkFetch();
      if (res?.success) {
        setMessage('Bulk fetch started');
        setProgress(res.data);
        setIsRunning(true);
      } else {
        setError(res?.message || 'Failed to start bulk fetch');
      }
    } catch (e) {
      setError(e?.message || 'Failed to start bulk fetch');
    }
  };

  const onStop = async () => {
    setError('');
    setMessage('');
    try {
      const res = await stopBulkFetch();
      if (res?.success) {
        setMessage('Bulk fetch stopped');
        setProgress(res.data);
        setIsRunning(false);
      } else {
        setError(res?.message || 'Failed to stop bulk fetch');
      }
    } catch (e) {
      setError(e?.message || 'Failed to stop bulk fetch');
    }
  };

  const pct = progress?.percentage || 0;
  const done = (progress?.completed || 0) + (progress?.failed || 0);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Bulk Fetch Stocks</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-flex gap-2 mb-3">
        <button className="btn btn-primary" onClick={onStart} disabled={isRunning}>Start Bulk Fetch</button>
        <button className="btn btn-outline-danger" onClick={onStop} disabled={!isRunning}>Stop</button>
        <button className="btn btn-outline-secondary" onClick={loadProgress}>Refresh</button>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Progress</h5>
          <div className="progress mb-3" style={{ height: '24px' }}>
            <div className="progress-bar" role="progressbar" style={{ width: `${pct}%` }} aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
              {pct}%
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-3"><div className="border rounded p-2"><div className="text-muted">Total</div><div className="fs-5">{progress?.total ?? '—'}</div></div></div>
            <div className="col-md-3"><div className="border rounded p-2"><div className="text-muted">Completed</div><div className="fs-5 text-success">{progress?.completed ?? 0}</div></div></div>
            <div className="col-md-3"><div className="border rounded p-2"><div className="text-muted">Failed</div><div className="fs-5 text-danger">{progress?.failed ?? 0}</div></div></div>
            <div className="col-md-3"><div className="border rounded p-2"><div className="text-muted">Running</div><div className="fs-5">{isRunning ? 'Yes' : 'No'}</div></div></div>
          </div>

          <div className="mt-3">
            <div className="row g-3">
              <div className="col-md-6"><div className="border rounded p-2"><div className="text-muted">Current Code</div><div className="fs-5">{progress?.current || '—'}</div></div></div>
              <div className="col-md-6"><div className="border rounded p-2"><div className="text-muted">Started</div><div className="fs-6">{fmtTime(progress?.startTime)}</div></div></div>
            </div>
          </div>

          {Array.isArray(progress?.errors) && progress.errors.length > 0 && (
            <div className="mt-3">
              <h6>Recent Errors</h6>
              <ul className="list-group">
                {progress.errors.slice(-5).reverse().map((e, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>
                      <strong>{e.tradingCode}</strong>: {e.error}
                    </span>
                    <span className="text-muted">{fmtTime(e.timestamp)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-muted">Done: {done} / {progress?.total || 0}. ETA: {progress?.estimatedTimeRemaining != null ? `${progress.estimatedTimeRemaining}s` : '—'}.</div>
    </div>
  );
};

export default BulkFetch;