const router=require('express').Router();
const {requireAdmin}=require('../middleware/AdminAuthMiddleware');
const MoneyRequest=require('../models/MoneyRequest');
const User=require('../models/User');
router.use(requireAdmin);
router.get('/requests',async(req,res)=>{
  try {
    const filter={status:req.query.status || 'Pending'};
    if(req.query.q?.trim()) filter.transactionId=new RegExp(req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
    const data=await MoneyRequest.find(filter).sort({createdAt:-1});res.json({success:true,data,count:data.length});
  } catch {res.status(400).json({success:false,message:'Unable to load requests'});}
});
async function settle(req,res,action) {
  const amount=req.body.newAmount;
  if(action==='Modified' && (!Number.isFinite(amount)||amount<=0)) return res.status(400).json({success:false,message:'Amount must be positive'});
  const status=action==='Rejected'?'Rejected':'Approved';
  const doc=await MoneyRequest.findOneAndUpdate({_id:req.params.id,status:'Pending'},{$set:{status}},{new:false});
  if(!doc) return res.status(409).json({success:false,message:'Request is missing or already settled'});
  try {
    const credited=action==='Modified'?amount:doc.requestedAmount;
    if(status==='Approved') {
      const result=await User.updateOne({_id:doc.userId},{$inc:{purchasePower:credited}});
      if(!result.matchedCount) throw new Error('User not found');
    }
    const history={action:action==='Modified'?'Modified':status,amountBefore:doc.requestedAmount,amountAfter:credited,notes:req.body.reason || '',actorRole:'admin',actorId:req.admin._id};
    const data=await MoneyRequest.findByIdAndUpdate(doc._id,{$set:{requestedAmount:credited,[status==='Approved'?'approvedAt':'rejectedAt']:new Date()},$push:{history}},{new:true});
    res.json({success:true,data});
  } catch(error) {await MoneyRequest.updateOne({_id:doc._id},{$set:{status:'Pending'}});throw error;}
}
for(const [route,action] of [['accept','Approved'],['reject','Rejected'],['modify','Modified']]) router.post(`/requests/:id/${route}`,async(req,res)=>{
  try {await settle(req,res,action);}catch {res.status(400).json({success:false,message:'Unable to settle request'});}
});
router.delete('/requests/:id',async(req,res)=>{
  try {const data=await MoneyRequest.findByIdAndDelete(req.params.id);if(!data)return res.status(404).json({success:false,message:'Request not found'});res.json({success:true});}
  catch {res.status(400).json({success:false,message:'Unable to delete request'});}
});
module.exports=router;
