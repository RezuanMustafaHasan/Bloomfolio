const Stock = require('../models/Stock');
const base = () => process.env.MARKET_DATA_URL || 'http://127.0.0.1:8000';
async function get(path) {
  const response = await fetch(base() + path, { signal: AbortSignal.timeout(90000) });
  const body = await response.json();
  if (!response.ok) { const error = new Error(body.detail || 'Market data unavailable'); error.status = response.status; throw error; }
  return body;
}
function flatSnapshot(stock) {
  const fields = {};
  for(const [key,value] of Object.entries(stock)) {
    if(['marketInformation','basicInformation'].includes(key)) for(const [k,v] of Object.entries(value)) fields[`${key}.${k}`]=v;
    else fields[key]=value;
  }
  return fields;
}
async function listStocks() {
  try {
    const result = await get('/api/stocks');
    await Stock.collection.bulkWrite(result.data.map(stock => ({updateOne:{filter:{tradingCode:stock.tradingCode},update:{$set:flatSnapshot(stock)},upsert:true}})));
    return result.data;
  } catch(error) {
    const saved = await Stock.find({}).lean();
    if (!saved.length) throw error;
    return saved.map(s=>({...s,dataSource:{...s.dataSource,stale:true}}));
  }
}
async function stockDetails(code) {
  try {
    const {data} = await get(`/api/stocks/${encodeURIComponent(code.toUpperCase())}`);
    await Stock.collection.updateOne({tradingCode:data.tradingCode},{$set:data},{upsert:true});
    return data;
  } catch(error) {
    if(error.status===404) return null;
    const saved = await Stock.findOne({tradingCode:code.toUpperCase()}).lean();
    if(!saved) throw error;
    return {...saved,dataSource:{...saved.dataSource,stale:true}};
  }
}
module.exports = {listStocks,stockDetails,get};
