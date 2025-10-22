import React, { useEffect, useMemo, useState } from 'react';
import './TradeModal.css';
import { useAuth } from '../context/AuthContext.jsx';
import { listOrders, placeOrder, executeOrder, myOrders, deleteOrder } from '../services/orders.js';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TradeModal = ({ isOpen, onClose, mode = 'BUY', tradingCode, currentPrice }) => {
  const [page, setPage] = useState(true);
  const [myOrdersList, setMyOrdersList] = useState([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [myOrdersError, setMyOrdersError] = useState('');
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
  const [availableShares, setAvailableShares] = useState(null);
  
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
    // Fetch available shares
    (async () => {
      try {
        if (!isAuthenticated || !userId) return;
        const res = await axios.get(`http://localhost:8080/users/${userId}/portfolio/${tradingCode}`, { withCredentials: true });
        const qty = Number(res?.data?.data?.quantity);
        setAvailableShares(Number.isFinite(qty) ? qty : 0);
      } catch (_) {
        setAvailableShares(null);
      }
    })();
    // My Orders loading effect moved to top-level
  }, [isOpen, tradingCode, currentPrice, isAuthenticated, userId]);

  // Load my orders when My Orders page is active
  useEffect(() => {
    if (!isOpen || page) return;
    const run = async () => {
      setLoadingMyOrders(true);
      setMyOrdersError('');
      try {
        const res = await myOrders();
        const data = res?.data || res || [];
        const filtered = data.filter((o) => o?.tradingCode === tradingCode);
        setMyOrdersList(filtered);
      } catch (err) {
        setMyOrdersError('Failed to load your orders');
      } finally {
        setLoadingMyOrders(false);
      }
    };
    run();
  }, [isOpen, page, tradingCode]);
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
        const orderId = res?.data?._id;
        try {
          if (orderId) {
            const exec = await executeOrder(orderId);
            if (!exec?.success) {
              // If execution fails, still show order placed but warn
              setPlaceError(exec?.message || 'Trade execution failed');
            }
          }
        } catch (_) {
          // Ignore execution error but surface message
          setPlaceError('Trade execution failed');
        }
        setPlaceSuccess('Order placed successfully');
        // refresh orders list and user info after execution
        try {
          const list = await listOrders({ tradingCode });
          setOrders(list?.data || []);
        } catch (_) {}
        try {
          if (isAuthenticated && userId) {
            const userRes = await axios.get(`http://localhost:8080/users/${userId}`, { withCredentials: true });
            setPurchasePower(userRes?.data?.purchasePower ?? null);
            const portRes = await axios.get(`http://localhost:8080/users/${userId}/portfolio/${tradingCode}`, { withCredentials: true });
            const qtyAfter = Number(portRes?.data?.data?.quantity);
            setAvailableShares(Number.isFinite(qtyAfter) ? qtyAfter : 0);
          }
        } catch (_) {}
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

  const handleDeleteOrder = async (id) => {
    try {
      await deleteOrder(id);
      const res = await myOrders();
      const data = res?.data || res || [];
      setMyOrdersList(data.filter((o) => o?.tradingCode === tradingCode));
    } catch (err) {
      setMyOrdersError('Failed to delete order');
    }
  };
  if (!isOpen) return null;

  return (
    <>
    <div className="trade-modal-overlay" role="dialog" aria-modal="true">
      <div className="trade-modal">
        {page ? 
        ( 
        <>
        <div className="modal-header">
          <div className="title-group">
            <h3 className="modal-title">{isBuy ? 'Buy' : 'Sell'} {tradingCode}</h3>
            <span className="subtitle">Trade at market-appropriate price</span>
          </div>
          <div className="header-actions d-flex align-items-center gap-2">
            <button
              type="button"
              className={`toggle-btn ${page ? 'active' : ''}`}
              onClick={() => setPage(true)}
            >
              Trade
            </button>
            <button
              type="button"
              className={`toggle-btn ${!page ? 'active' : ''}`}
              onClick={() => setPage(false)}
            >
              My Orders
            </button>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>
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
                                <span className="price">৳{o.askingPrice?.toFixed?.(2) ?? o.askingPrice}</span>
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
                              <span className="price">৳{o.askingPrice?.toFixed?.(2) ?? o.askingPrice}</span>
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
                  {isBuy ? (
                    <div className="power">Purchase Power: {purchasePower == null ? '—' : `৳${purchasePower}`}</div>
                  ) : (
                    <div className="power">Available Shares: {availableShares == null ? '—' : `${availableShares}`}</div>
                  )}
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
                  <div className="estimate">Estimated {isBuy ? 'Cost' : 'Proceeds'}: {estimatedCost == null ? '—' : `৳${estimatedCost.toFixed(2)}`}</div>
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
        </div></>):(
          <>
            <div className="modal-header">
              <div className="title-group">
                <h3 className="modal-title">My Orders ({tradingCode})</h3>
                <span className="subtitle">Review and manage your orders</span>
              </div>
              <div className="header-actions d-flex align-items-center gap-2">
                <button
                  type="button"
                  className={`toggle-btn ${page ? 'active' : ''}`}
                  onClick={() => setPage(true)}
                >
                  Trade
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${!page ? 'active' : ''}`}
                  onClick={() => setPage(false)}
                >
                  My Orders
                </button>
                <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="orders-panel">
                <div className="panel-header d-flex align-items-center justify-content-between">
                  <h5 className="m-0">My Orders ({tradingCode})</h5>
                </div>
                {loadingMyOrders ? (
                  <div className="py-3 text-center">Loading…</div>
                ) : myOrdersError ? (
                  <div className="alert alert-danger my-2">{myOrdersError}</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Price</th>
                          <th>Qty</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myOrdersList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted">No orders found</td>
                          </tr>
                        ) : (
                          myOrdersList.slice(0, 50).map((o) => (
                            <tr key={o._id}>
                              <td>{o.orderType}</td>
                              <td>{Number(o.askingPrice).toFixed(2)}</td>
                              <td>{o.quantity}</td>
                              <td>{o.status || 'PENDING'}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteOrder(o._id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  </>)
};

export default TradeModal;