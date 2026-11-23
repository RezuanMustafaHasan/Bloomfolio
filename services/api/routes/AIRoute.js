const router=require('express').Router();
const Stock=require('../models/Stock');
const ChatSession=require('../models/ChatSession');
const {requireUser}=require('../middleware/AuthMiddleware');
router.use(requireUser);
router.get('/sessions',async(req,res)=>{
  try {const data=await ChatSession.find({userId:req.userId}).sort({updatedAt:-1}).select('_id title tradingCodes updatedAt');res.json({success:true,data});}
  catch {res.status(500).json({success:false,message:'Could not load conversations'});}
});
router.get('/session/:id',async(req,res)=>{
  try {const data=await ChatSession.findOne({_id:req.params.id,userId:req.userId});if(!data)return res.status(404).json({success:false,message:'Conversation not found'});res.json({success:true,data});}
  catch {res.status(400).json({success:false,message:'Invalid conversation'});}
});
router.post('/chat',async(req,res)=>{
  try {
    const {question,sessionId}=req.body;
    if(typeof question!=='string'||!question.trim()||question.length>4000)return res.status(400).json({success:false,message:'Enter a question of 1–4000 characters'});
    const codes=[...new Set((req.body.tradingCodes || []).map(c=>String(c).toUpperCase()))].slice(0,5);
    const stocks=await Stock.find({tradingCode:{$in:codes}}).lean();
    const context=stocks.map(s=>({symbol:s.tradingCode,name:s.companyName,sector:s.sector,currency:'BDT',quoteDate:s.marketInformation.asOfDate,lastPriceBDT:s.marketInformation.lastTradingPrice,changePercent:s.marketInformation.changePercentage,marketCapBDT:s.marketInformation.marketCapitalization,epsBDT:s.fundamentals?.eps,pe:s.fundamentals?.pe,source:s.dataSource?.name}));
    let session=sessionId?await ChatSession.findOne({_id:sessionId,userId:req.userId}):null;
    if(sessionId&&!session)return res.status(404).json({success:false,message:'Conversation not found'});
    const instruction='You explain DSE company data for an educational trading simulator. Be concise and factual. Use only the supplied figures for company-specific claims, mention the quote date, and say when information is missing. Do not invent figures or give personalized buy/sell instructions. All prices are Bangladeshi taka: use BDT or ৳, never dollars or $. Report only the requested supplied facts. Do not speculate about valuation or claim a provided field is missing. Use at most 100 words.';
    const prompt=instruction+'\nCompany data: '+JSON.stringify(context)+'\nRecent conversation: '+JSON.stringify(session?.messages.slice(-6)||[])+'\nQuestion: '+question.trim();
    let answer,usedModel;
    const provider=process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY?'gemini':'ollama');
    if(provider==='ollama') {
      usedModel=process.env.OLLAMA_MODEL || 'qwen3:0.6b';
      const response=await fetch((process.env.OLLAMA_URL || 'http://127.0.0.1:11434')+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:usedModel,messages:[{role:'user',content:prompt}],stream:false,think:false,options:{temperature:0.2,num_predict:350}}),signal:AbortSignal.timeout(60000)});
      const body=await response.json();if(!response.ok)throw new Error('Local AI model is unavailable. Check Ollama and the configured model.');
      answer=body.message?.content?.trim();
    } else {
      if(!process.env.GEMINI_API_KEY)throw new Error('Configure GEMINI_API_KEY or choose AI_PROVIDER=ollama.');
      usedModel=process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${usedModel}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:700}}),signal:AbortSignal.timeout(45000)});
      const body=await response.json();if(!response.ok)throw new Error(`Gemini could not respond (HTTP ${response.status}). Check the configured key/model or use local Ollama.`);
      answer=body.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n').trim();
    }
    if(!answer)throw new Error('The model returned an empty answer. Retry with a shorter question.');
    if(!session)session=new ChatSession({userId:req.userId,title:question.trim().slice(0,60),tradingCodes:codes,messages:[]});
    session.tradingCodes=[...new Set([...session.tradingCodes,...codes])];
    session.messages.push({from:'user',text:question.trim()},{from:'ai',text:answer});await session.save();
    res.json({success:true,data:{answer,model:usedModel,provider,sessionId:String(session._id),codes}});
  } catch(error) {res.status(503).json({success:false,message:error.name==='TimeoutError'?'The AI request timed out. Please retry.':error.message});}
});
module.exports=router;
