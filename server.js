require("dotenv").config();
const express = require("express");
const Replicate = require("replicate");

const app = express();
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ViraAI</title>
<style>
body{margin:0;background:#090b10;color:#fff;font-family:Arial;padding:25px}
main{max-width:700px;margin:auto;background:#121620;border:1px solid #292f3d;border-radius:22px;padding:25px}
h1{font-size:32px}.a{color:#8b7cff}.muted{color:#9da5b4;line-height:1.7}
input{width:100%;padding:15px;border-radius:12px;border:1px solid #343b4b;background:#0b0f16;color:#fff;box-sizing:border-box;direction:ltr}
button,a{padding:13px 17px;border-radius:12px;border:0;background:#8b7cff;color:#fff;font-weight:bold;cursor:pointer;text-decoration:none}
.q{background:#181d28;border:1px solid #343b4b}.on{background:#8b7cff}
#go{width:100%;margin-top:18px;font-size:16px}#status{margin-top:16px;padding:13px;background:#0d1119;border-radius:12px;display:none}
#result{display:none;margin-top:18px}video{width:100%;border-radius:14px}.save{display:block;text-align:center;background:#23b26d;margin-top:12px}
</style>
</head>
<body>
<main>
<h1>Vira<span class="a">AI</span> 🤖</h1>
<p class="muted">حسّن فيديوك من رابط مباشر بالذكاء الاصطناعي.</p>
<input id="url" placeholder="https://example.com/video.mp4">
<div style="display:flex;gap:8px;margin-top:12px">
<button class="q" data-q="480p">480p</button>
<button class="q on" data-q="720p">720p</button>
<button class="q" data-q="1080p">1080p</button>
</div>
<button id="go">🤖 ابدأ المعالجة</button>
<div id="status"></div>
<div id="result">
<video id="v" controls></video>
<a id="save" class="save" target="_blank">⬇️ حفظ الفيديو</a>
</div>
</main>
<script>
let q="720p";
document.querySelectorAll(".q").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".q").forEach(x=>x.classList.remove("on"));
 b.classList.add("on"); q=b.dataset.q;
});
go.onclick=async()=>{
 let u=url.value.trim();
 if(!u)return alert("ألصق الرابط أولاً");
 go.disabled=true; status.style.display="block"; status.textContent="جاري المعالجة 🤖…";
 try{
  let r=await fetch("/api/process",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:u,quality:q})});
  let d=await r.json(); if(!r.ok)throw Error(d.error||"تعذر المعالجة");
  status.textContent="اكتملت المعالجة ✅"; v.src=d.output; save.href=d.output; result.style.display="block";
 }catch(e){status.textContent="❌ "+e.message}
 go.disabled=false;
};
</script>
</body>
</html>`));

app.post("/api/process", async (req,res)=>{
 try{
  if(!process.env.REPLICATE_API_TOKEN)
   return res.status(500).json({error:"أضف مفتاح Replicate API أولاً"});
  const {url,quality}=req.body||{};
  if(!/^https?:\/\//i.test(url||""))
   return res.status(400).json({error:"ضع رابط HTTPS مباشر لفيديو تملك حق استخدامه"});
  const resolution=({"480p":"SD","720p":"HD","1080p":"FHD"})[quality]||"HD";
  const output=await replicate.run("lucataco/real-esrgan-video",{
   input:{video_path:url,model:"RealESRGAN_x4plus",resolution}
  });
  const out=typeof output==="string" ? output : (output?.url||output?.[0]?.url||output?.[0]);
  if(!out) throw new Error("لم يرجع النموذج ملفاً");
  res.json({output:out});
 }catch(e){res.status(500).json({error:e.message||"حدث خطأ أثناء المعالجة"})}
});

app.listen(process.env.PORT||3000);
