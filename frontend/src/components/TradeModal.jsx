import React, { useEffect, useMemo, useState } from 'react';
import './TradeModal.css';
import { useAuth } from '../context/AuthContext.jsx';
import { listOrders, placeOrder } from '../services/orders.js';
import axios from 'axios';

const TradeModal = ({ isOpen, onClose, mode = 'BUY', tradingCode, currentPrice }) => {
  const { isAuthenticated, userId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [quantity, setQuantity] = useState('');
  const [askingPrice, setAskingPrice] = useState(currentPrice ?? '');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [placeSuccess, setPlaceSuccess] = useState('');

  const [purchasePower, setPurchasePower] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const isBuy = String(mode).toUpperCase() === 'BUY';

  useEffect(() => {
    if (!isOpen) return;
    setAskingPrice(currentPrice ?? '');
    setQuantity('');
    setPlaceError('');
    setPlaceSuccess('');
    // Fetch orders
    (async () => {
      setLoadingOrders(true);
      setOrderError('');
      try {
        const res = await listOrders({ tradingCode });
        setOrders(res?.data || []);
      } catch (err) {
        setOrderError('Failed to load orders');
      } finally {
        setLoadingOrders(false);
      }
    })();
    // Fetch purchase power
    (async () => {
      try {
        if (!isAuthenticated || !userId) return;
        const res = await axios.get(`http://localhost:8080/users/${userId}`, { withCredentials: true });
        setPurchasePower(res?.data?.purchasePower ?? null);
        setUserEmail(res?.data?.email ?? null);
      } catch (_) {
        setPurchasePower(null);
        setUserEmail(null);
      }
    })();
  }, [isOpen, tradingCode, currentPrice, isAuthenticated, userId]);

  const buyOrders = useMemo(() => orders.filter(o => o.orderType === 'BUY'), [orders]);
  const sellOrders = useMemo(() => orders.filter(o => o.orderType === 'SELL'), [orders]);

  const estimatedCost = useMemo(() => {
    const qty = Number(quantity);
    const price = Number(askingPrice);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return null;
    return qty * price;
  }, [quantity, askingPrice]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setPlaceError('');
    setPlaceSuccess('');
    const qty = Number(quantity);
    const price = Number(askingPrice);
    if (!Number.isInteger(qty) || qty <= 0) {
      setPlaceError('Quantity must be a positive integer');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setPlaceError('Asking price must be a positive number');
      return;
    }
    setPlacing(true);
    try {
      const res = await placeOrder({ tradingCode, orderType: isBuy ? 'BUY' : 'SELL', askingPrice: price, quantity: qty, userEmail });
      if (res?.success) {
        setPlaceSuccess('Order placed successfully');
        // refresh orders list
        const list = await listOrders({ tradingCode });
        setOrders(list?.data || []);
        setQuantity('');
        setAskingPrice(currentPrice ?? '');
      } else {
        setPlaceError(res?.message || 'Failed to place order');
      }
    } catch (err) {
      setPlaceError('Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trade-modal-overlay" role="dialog" aria-modal="true">
      <div className="trade-modal">
        <div className="modal-header">
          <div className="title-group">
            <h3 className="modal-title">{isBuy ? 'Buy' : 'Sell'} {tradingCode}</h3>
            <span className="subtitle">Trade at market-appropriate price</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="row g-4">
            {/* Left: Orders list */}
            <div className="col-12 col-lg-7">
              <div className="orders-panel">
                <div className="panel-header">
                  <h5>Current Orders ({tradingCode})</h5>
                  <small className="text-muted">Live pending orders</small>
                </div>
                {loadingOrders ? (
                  <div className="loading">Loading orders…</div>
                ) : orderError ? (
                  <div className="error">{orderError}</div>
                ) : (
                  <div className="orders-columns">
                    <div className="orders-column">
                      <div className="column-title buy">Buy Orders</div>
                      {buyOrders.length === 0 ? (
                        <div className="empty">No buy orders</div>
                      ) : (
                        <ul className="orders-list">
                          {buyOrders.slice(0, 10).map(o => (
                            <li key={o._id} className="order-item">
                              {/* <span className="type-badge buy">BUY</span> */}
                                <span className="price">${o.askingPrice?.toFixed?.(2) ?? o.askingPrice}</span>
                                <span className="qty">× {o.quantity}</span>
                              {/* <span className={`status ${o.status?.toLowerCase()}`}>{o.status}</span> */}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="orders-column">
                      <div className="column-title sell">Sell Orders</div>
                      {sellOrders.length === 0 ? (
                        <div className="empty">No sell orders</div>
                      ) : (
                        <ul className="orders-list">
                          {sellOrders.slice(0, 10).map(o => (
                            <li key={o._id} className="order-item">
                              {/* <span className="type-badge sell">SELL</span> */}
                              <span className="price">${o.askingPrice?.toFixed?.(2) ?? o.askingPrice}</span>
                              <span className="qty">× {o.quantity}</span>
                              {/* <span className={`status ${o.status?.toLowerCase()}`}>{o.status}</span> */}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Trading form */}
            <div className="col-12 col-lg-5">
              <form className="trade-form" onSubmit={onSubmit}>
                <div className="form-header">
                  <h5>Trading Form</h5>
                  <div className="power">Purchase Power: {purchasePower == null ? '—' : `$${purchasePower}`}</div>
                </div>

                <div className="form-row">
                  <label>Trading Code</label>
                  <input type="text" value={tradingCode || ''} readOnly className="input readonly" />
                </div>
                <div className="form-row">
                  <label>Current Price</label>
                  <input type="number" value={currentPrice ?? ''} readOnly className="input readonly" />
                </div>
                <div className="form-row">
                  <label>Asking Price</label>
                  <input
                    type="number"
                    className="input"
                    step="0.01"
                    min="0"
                    placeholder="Enter price"
                    value={askingPrice}
                    onChange={e => setAskingPrice(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>Quantity</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>

                <div className="form-meta">
                  <div className="estimate">Estimated {isBuy ? 'Cost' : 'Proceeds'}: {estimatedCost == null ? '—' : `$${estimatedCost.toFixed(2)}`}</div>
                </div>

                {placeError && <div className="error">{placeError}</div>}
                {placeSuccess && <div className="success">{placeSuccess}</div>}

                <div className="actions">
                  <button type="submit" className={`submit-btn ${isBuy ? 'buy' : 'sell'}`} disabled={placing || !isAuthenticated}>
                    {placing ? 'Submitting…' : (isBuy ? 'Place Buy Order' : 'Place Sell Order')}
                  </button>
                  <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;