const Stock = require('../models/Stock');
const fs = require('node:fs');
const path = require('node:path');
const progressFile = path.join(__dirname, '../.cache/bulk-progress.json');
class BulkStockFetcher {
  constructor() {
    this.isRunning = false;
    this.stopRequested = false;
    this.progress = {total:0,completed:0,failed:0,current:null,startTime:null,errors:[]};
    if(fs.existsSync(progressFile)) { try { this.progress = JSON.parse(fs.readFileSync(progressFile)); } catch {} }
  }
  persist() { fs.mkdirSync(path.dirname(progressFile),{recursive:true});fs.writeFileSync(progressFile,JSON.stringify(this.progress)); }
  async fetchAllStocks() {
    if(this.isRunning) throw new Error('Bulk fetch is already running');
    this.isRunning = true;this.stopRequested = false;
    this.progress = {total:0,completed:0,failed:0,current:null,startTime:new Date(),errors:[],stopped:false};
    try {
      const response = await fetch((process.env.MARKET_DATA_URL || 'http://127.0.0.1:8000')+'/api/stocks',{signal:AbortSignal.timeout(90000)});
      const body = await response.json();if(!response.ok || !body.data?.length) throw new Error(body.detail || 'No market snapshots returned');
      this.progress.total = body.data.length;
      for(const stock of body.data) {
        if(this.stopRequested) {this.progress.stopped=true;break;}
        this.progress.current = stock.tradingCode;
        try {
          const fields = {};
          for(const [key,value] of Object.entries(stock)) {
            if(['marketInformation','basicInformation'].includes(key)) for(const [k,v] of Object.entries(value)) fields[`${key}.${k}`]=v;
            else fields[key]=value;
          }
          await Stock.collection.updateOne({tradingCode:stock.tradingCode},{$set:fields},{upsert:true});this.progress.completed++;
        } catch(error) {this.progress.failed++;this.progress.errors.push({tradingCode:stock.tradingCode,error:error.message,timestamp:new Date()});}
        // Yield between records so Stop can interrupt the job.
        await new Promise(resolve=>setTimeout(resolve,10));
      }
    } catch(error) {this.progress.errors.push({tradingCode:'Provider',error:error.message,timestamp:new Date()});throw error;}
    finally {this.isRunning=false;this.progress.current=null;this.persist();}
    return this.getProgress();
  }
  getProgress() {
    const done=this.progress.completed+this.progress.failed;
    return {...this.progress,isRunning:this.isRunning,percentage:this.progress.total?Math.round(done/this.progress.total*100):0,
      estimatedTimeRemaining:done?Math.round((Date.now()-new Date(this.progress.startTime))/done*(this.progress.total-done)/1000):null};
  }
  stop() {this.stopRequested=true;}
}
module.exports = new BulkStockFetcher();
