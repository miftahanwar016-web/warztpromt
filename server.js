// WARZT PROMT - Telegram Cloud Backend
// Node.js 18+
// Token Telegram hanya disimpan di server, JANGAN masukkan ke HTML.

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const WARZT_KEY = process.env.WARZT_CLOUD_KEY || "";
const DATA_FILE = path.join(__dirname, "warzt-cloud.json");

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-WARZT-KEY",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let s="";
    req.on("data",c=>{s+=c;if(s.length>20_000_000) req.destroy();});
    req.on("end",()=>{try{resolve(JSON.parse(s||"{}"))}catch(e){reject(e)}});
    req.on("error",reject);
  });
}
function authorized(req) {
  return !!WARZT_KEY && crypto.timingSafeEqual(
    Buffer.from(String(req.headers["x-warzt-key"]||"")),
    Buffer.from(WARZT_KEY)
  );
}
async function tg(method, body) {
  if(!BOT_TOKEN || !CHAT_ID) throw Error("Telegram environment belum dikonfigurasi");
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
  });
  const d=await r.json();
  if(!r.ok || !d.ok) throw Error(d.description||"Telegram API error");
  return d;
}
function atomicWrite(obj) {
  const tmp=DATA_FILE+".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj,null,2), {encoding:"utf8",mode:0o600});
  fs.renameSync(tmp,DATA_FILE);
}
function localRead() {
  if(!fs.existsSync(DATA_FILE)) return null;
  try{return JSON.parse(fs.readFileSync(DATA_FILE,"utf8"))}catch{return null}
}
async function main() {
  const server=http.createServer(async(req,res)=>{
    if(req.method==="OPTIONS"){send(res,204,{});return}
    if(req.url==="/health"){send(res,200,{ok:true,telegramConfigured:!!(BOT_TOKEN&&CHAT_ID)});return}
    if(!authorized(req)){send(res,401,{ok:false,error:"Unauthorized"});return}
    if(req.method!=="POST"){send(res,405,{ok:false,error:"Method not allowed"});return}
    try {
      const body=await readBody(req);
      if(req.url==="/sync"){
        if(!Array.isArray(body.users)||!Array.isArray(body.prompts)) throw Error("Payload data invalid");
        atomicWrite(body);
        const text=`WARZT PROMT BACKUP\nversion=${body.version||2}\nsavedAt=${body.savedAt||new Date().toISOString()}\nJSON backup terlampir.`;
        const file=path.join(__dirname,`warzt-${Date.now()}.json`);
        fs.writeFileSync(file,JSON.stringify(body,null,2),{mode:0o600});
        await tg("sendDocument",{chat_id:CHAT_ID,document:require("fs").createReadStream(file),caption:text});
        fs.unlinkSync(file);
        send(res,200,{ok:true});
        return;
      }
      if(req.url==="/pull"){
        const local=localRead();
        if(local){send(res,200,{ok:true,data:local,source:"server-cache"});return}
        send(res,404,{ok:false,error:"Belum ada backup tersimpan"});
        return;
      }
      send(res,404,{ok:false,error:"Not found"});
    } catch(e) { send(res,500,{ok:false,error:e.message}); }
  });
  server.listen(PORT,()=>console.log(`WARZT backend listening on ${PORT}`));
}
main().catch(e=>{console.error(e);process.exit(1)});
