import React, { useEffect, useState } from 'react';
import { myOrders, resubmitOrder } from '../services/orders';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null); // { id, orderType, askingPrice, quantity, tradingCode }
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await myOrders();
      setOrders(res?.data || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (o) => {
    setSuccess('');
    setError('');
    setEditing({
      id: o._id,
      orderType: o.orderType,
      askingPrice: o.askingPrice,
      quantity: o.quantity,
      tradingCode: o.tradingCode,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditing(prev => ({ ...prev, [name]: name === 'askingPrice' || name === 'quantity' ? value : value }));
  };

  const submitResubmit = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const qty = Number(editing.quantity);
    const price = Number(editing.askingPrice);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError('Quantity must be a positive integer');
      setSaving(false);
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Asking price must be a positive number');
      setSaving(false);
      return;
    }
    try {
      const res = await resubmitOrder(editing.id, {
        orderType: editing.orderType,
        askingPrice: price,
        quantity: qty,
        tradingCode: editing.tradingCode,
      });
      if (res?.success) {
        setSuccess('Order resubmitted successfully');
        setEditing(null);
        await load();
      } else {
        setError(res?.message || 'Failed to resubmit order');
      }
    } catch (err) {
      setError('Failed to resubmit order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">My Orders</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Trading Code</th>
                <th>Type</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="6">No orders yet</td></tr>
              ) : orders.map(o => (
                editing && editing.id === o._id ? (
                  <tr key={o._id}>
                    <td>
                      <input type="text" className="form-control" name="tradingCode" value={editing.tradingCode} onChange={onEditChange} />
                    </td>
                    <td>
                      <select className="form-select" name="orderType" value={editing.orderType} onChange={onEditChange}>
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" step="0.01" min="0.01" className="form-control" name="askingPrice" value={editing.askingPrice} onChange={onEditChange} />
                    </td>
                    <td>
                      <input type="number" min="1" step="1" className="form-control" name="quantity" value={editing.quantity} onChange={onEditChange} />
                    </td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-secondary me-2" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      <button className="btn btn-primary" onClick={submitResubmit} disabled={saving}>Save & Resubmit</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={o._id}>
                    <td>{o.tradingCode}</td>
                    <td>{o.orderType}</td>
                    <td>{typeof o.askingPrice === 'number' ? o.askingPrice.toFixed(2) : o.askingPrice}</td>
                    <td>{o.quantity}</td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-outline-primary" onClick={() => startEdit(o)}>Edit & Resubmit</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyOrders;