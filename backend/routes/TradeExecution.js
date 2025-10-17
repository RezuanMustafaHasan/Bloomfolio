const router = require('express').Router();
const mongoose = require('mongoose');
const { requireUser } = require('../middleware/AuthMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');

// POST /api/order/execute/:orderId
router.post('/execute/:orderId', requireUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    // 1) Validate and fetch original order
    const original = await Order.findById(orderId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const price = Number(original.askingPrice);
    let remainingQty = Number(original.quantity);
    const code = String(original.tradingCode).toUpperCase();
    const originalType = String(original.orderType).toUpperCase();
    const oppositeType = originalType === 'BUY' ? 'SELL' : 'BUY';

    // Helper functions for portfolio updates
    const getPortfolioEntry = (userDoc) => userDoc.portfolio.find(p => p.stock === code);

    const ensureSellerCapacity = async (userId) => {
      const seller = await User.findById(userId);
      if (!seller) return 0;
      const p = getPortfolioEntry(seller);
      return Math.max(0, p?.quantity || 0);
    };

    const updateBuyerAfterTrade = async (buyerId, qty) => {
      const buyer = await User.findById(buyerId);
      if (!buyer) throw new Error('Buyer not found');
      const cost = qty * price;
      if (buyer.purchasePower < cost) throw new Error('Buyer cannot afford');
      buyer.purchasePower -= cost;
      let p = getPortfolioEntry(buyer);
      if (!p) {
        buyer.portfolio.push({ stock: code, quantity: qty, buyPrice: price, date: new Date() });
      } else {
        const totalCost = p.quantity * p.buyPrice + cost;
        const newQty = p.quantity + qty;
        p.buyPrice = newQty > 0 ? totalCost / newQty : price;
        p.quantity = newQty;
        p.date = new Date();
      }
      await buyer.save();
    };

    const updateSellerAfterTrade = async (sellerId, qty) => {
      const seller = await User.findById(sellerId);
      if (!seller) throw new Error('Seller not found');
      const revenue = qty * price;
      seller.purchasePower += revenue;
      let p = getPortfolioEntry(seller);
      const newQty = Math.max(0, (p?.quantity || 0) - qty);
      if (p) {
        p.quantity = newQty;
        p.date = new Date();
      }
      // If quantity hits zero, remove entry
      if (p && p.quantity === 0) {
        seller.portfolio = seller.portfolio.filter(e => e.stock !== code);
      }
      await seller.save();
    };

    // Recursively fetch and process opposite orders FIFO until filled or none
    let processed = [];
    while (remainingQty > 0) {
      const matches = await Order.find({
        tradingCode: code,
        orderType: oppositeType,
        askingPrice: price,
      }).sort({ createdAt: 1, serial: 1 });

      if (!matches.length) break;

      for (const match of matches) {
        if (remainingQty <= 0) break;

        // Compute executable quantity baseline by remaining and match remaining
        let execQty = Math.min(remainingQty, Number(match.quantity));
        if (execQty <= 0) continue;

        if (originalType === 'BUY') {
          // Initiator is buyer; counterparty is seller
          const buyer = await User.findById(original.userId);
          if (!buyer) throw new Error('Buyer not found');
          const maxAffordable = Math.floor(buyer.purchasePower / price);
          execQty = Math.min(execQty, maxAffordable);

          // Seller capacity by holdings
          const sellerHoldings = await ensureSellerCapacity(match.userId);
          execQty = Math.min(execQty, sellerHoldings);

          if (execQty <= 0) {
            // Buyer cannot afford or seller cannot sell; delete buyer's unfilled if no affordability
            if (maxAffordable <= 0) {
              remainingQty = 0;
              await Order.deleteOne({ _id: original._id });
              processed.push({ matchId: match._id, qty: 0 });
              break;
            }
            continue;
          }

          // Execute
          await updateBuyerAfterTrade(buyer._id, execQty);
          await updateSellerAfterTrade(match.userId, execQty);
          // Record transaction references
          await User.updateOne({ _id: buyer._id }, { $addToSet: { orderList: original._id } });
          await User.updateOne({ _id: match.userId }, { $addToSet: { orderList: match._id } });
          // Append transaction history for both participants
          await User.updateOne(
            { _id: buyer._id },
            {
              $push: {
                transactionHistory: {
                  action: 'BUY',
                  tradingCode: code,
                  price,
                  quantity: execQty,
                  orderId: original._id,
                  matchedOrderId: match._id,
                  timestamp: new Date(),
                }
              }
            }
          );
          await User.updateOne(
            { _id: match.userId },
            {
              $push: {
                transactionHistory: {
                  action: 'SELL',
                  tradingCode: code,
                  price,
                  quantity: execQty,
                  orderId: match._id,
                  matchedOrderId: original._id,
                  timestamp: new Date(),
                }
              }
            }
          );

        } else {
          // Initiator is seller; counterparty is buyer
          const sellerAvail = await ensureSellerCapacity(original.userId);
          remainingQty = Math.min(remainingQty, sellerAvail);
          if (remainingQty <= 0) {
            // Seller has no holdings; delete unfilled portion
            await Order.deleteOne({ _id: original._id });
            processed.push({ matchId: match._id, qty: 0 });
            break;
          }

          const buyer = await User.findById(match.userId);
          if (!buyer) {
            // Counterparty not found; skip
            continue;
          }
          const maxAffordable = Math.floor(buyer.purchasePower / price);
          execQty = Math.min(execQty, maxAffordable);
          if (execQty <= 0) {
            // Counterparty cannot afford; skip this match
            continue;
          }

          // Execute
          await updateBuyerAfterTrade(buyer._id, execQty);
          await updateSellerAfterTrade(original.userId, execQty);
          // Record transaction references
          await User.updateOne({ _id: buyer._id }, { $addToSet: { orderList: match._id } });
          await User.updateOne({ _id: original.userId }, { $addToSet: { orderList: original._id } });
          // Append transaction history for both participants
          await User.updateOne(
            { _id: buyer._id },
            {
              $push: {
                transactionHistory: {
                  action: 'BUY',
                  tradingCode: code,
                  price,
                  quantity: execQty,
                  orderId: match._id,
                  matchedOrderId: original._id,
                  timestamp: new Date(),
                }
              }
            }
          );
          await User.updateOne(
            { _id: original.userId },
            {
              $push: {
                transactionHistory: {
                  action: 'SELL',
                  tradingCode: code,
                  price,
                  quantity: execQty,
                  orderId: original._id,
                  matchedOrderId: match._id,
                  timestamp: new Date(),
                }
              }
            }
          );
        }

        // Update remaining quantities in orders
        remainingQty -= execQty;
        const matchRemaining = Number(match.quantity) - execQty;
        if (matchRemaining <= 0) {
          await Order.deleteOne({ _id: match._id });
        } else {
          await Order.updateOne({ _id: match._id }, { $set: { quantity: matchRemaining } });
        }

        processed.push({ matchId: match._id, qty: execQty });
      }

      // Loop continues to re-fetch matches if remainingQty > 0
    }

    // Finalize original order state
    if (remainingQty <= 0) {
      await Order.deleteOne({ _id: original._id });
    } else {
      await Order.updateOne({ _id: original._id }, { $set: { quantity: remainingQty } });
    }

    return res.json({ success: true, message: 'Execution complete', data: { remainingQty, processed } });
  } catch (err) {
    console.error('Trade execution error:', err);
    return res.status(500).json({ success: false, message: 'Execution failed', error: err.message });
  }
});

module.exports = router;