const router = require('express').Router();
const { requireUser } = require('../middleware/AuthMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');
// Serialize the local simulation so two requests cannot consume the same order.
let queue = Promise.resolve();
async function execute(req,res) {
  const original = await Order.findById(req.params.orderId);
  if(!original) return res.status(404).json({success:false,message:'Order not found'});
  if(String(original.userId)!==String(req.userId)) return res.status(403).json({success:false,message:'Forbidden'});
  const matches = await Order.find({tradingCode:original.tradingCode,orderType:original.orderType==='BUY'?'SELL':'BUY',askingPrice:original.askingPrice,userId:{$ne:original.userId},status:'PENDING'}).sort({createdAt:1,serial:1});
  let remainingQty=original.quantity;const processed=[];const price=original.askingPrice;
  for(const match of matches) {
    if(remainingQty<=0) break;
    const buyer=await User.findById(original.orderType==='BUY'?original.userId:match.userId);
    const seller=await User.findById(original.orderType==='SELL'?original.userId:match.userId);
    if(!buyer || !seller) continue;
    const holding=seller.portfolio.find(p=>p.stock===original.tradingCode);
    const qty=Math.min(remainingQty,match.quantity,Math.floor(buyer.purchasePower/price),holding?.quantity || 0);
    if(qty<=0) continue;
    const cost=qty*price;
    buyer.purchasePower=Math.round((buyer.purchasePower-cost)*100)/100;
    seller.purchasePower=Math.round((seller.purchasePower+cost)*100)/100;
    const bought=buyer.portfolio.find(p=>p.stock===original.tradingCode);
    if(bought) {bought.buyPrice=(bought.quantity*bought.buyPrice+cost)/(bought.quantity+qty);bought.quantity+=qty;}
    else buyer.portfolio.push({stock:original.tradingCode,quantity:qty,buyPrice:price});
    holding.quantity-=qty;seller.portfolio=seller.portfolio.filter(p=>p.quantity>0);
    for(const [user,action] of [[buyer,'BUY'],[seller,'SELL']]) user.transactionHistory.push({action,tradingCode:original.tradingCode,price,quantity:qty,timestamp:new Date()});
    await buyer.save();await seller.save();
    remainingQty-=qty;match.quantity-=qty;
    if(match.quantity===0) await match.deleteOne();else await match.save();
    processed.push({matchId:match._id,qty});
  }
  if(remainingQty===0) await original.deleteOne();else {original.quantity=remainingQty;await original.save();}
  return res.json({success:true,message:'Execution complete',data:{remainingQty,processed}});
}
router.post('/execute/:orderId', requireUser,(req,res)=>{
  const task=queue.then(()=>execute(req,res));queue=task.catch(()=>{});
  task.catch(error=>res.status(400).json({success:false,message:'Execution failed',error:error.message}));
});
module.exports=router;
