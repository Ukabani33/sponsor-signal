(function(){
  "use strict";
  var root = document.body.dataset.root || "";
  var $ = function(s, c){ return (c||document).querySelector(s); }, $$ = function(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  function toast(msg){ var t=$("#toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove("show");},2600); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }

  // vertical selector
  $$(".v.soon").forEach(function(b){
    b.dataset.short = b.dataset.soon.split(" ")[0] === "Women" ? "Women founders" : "Social-first";
    b.addEventListener("click", function(){ toast(b.dataset.soon + " tracker is coming soon — join the newsletter to get it first."); });
  });

  // newsletter (local only; no email service)
  var nl = $("#nl");
  if (nl) nl.addEventListener("submit", function(e){
    e.preventDefault();
    var email = $("input", nl).value.trim(), v = $("select", nl).value;
    try { var list = JSON.parse(localStorage.getItem("ss_signups")||"[]"); list.push({email:email, vertical:v, at:new Date().toISOString()}); localStorage.setItem("ss_signups", JSON.stringify(list)); } catch(_){}
    nl.innerHTML = '<p style="margin:0;color:#7dd3c0;font-weight:600">Thanks — you\'re on the list. First Signal lands Monday.</p>';
  });

  // simple table filter (brands index)
  $$("input[data-filter]").forEach(function(inp){
    var tb = $(inp.dataset.filter + " tbody");
    inp.addEventListener("input", function(){ var q=inp.value.toLowerCase(); $$("tr", tb).forEach(function(r){ r.style.display = r.textContent.toLowerCase().indexOf(q) > -1 ? "" : "none"; }); });
  });

  // pitch board segment filter
  var seg = $(".seg");
  if (seg) seg.addEventListener("click", function(e){
    var b = e.target.closest("button"); if(!b) return;
    $$("button", seg).forEach(function(x){ x.classList.toggle("on", x===b); });
    var m = b.dataset.show;
    $$(".tcard").forEach(function(c){
      var show = m==="all" || (m==="fresh" && $(".tag.hot", c)) ||
        (m==="kai" && !$(".concepts>div:first-child", c).classList.contains("low")) ||
        (m==="jason" && !$(".concepts>div:last-child", c).classList.contains("low"));
      c.classList.toggle("hide", !show);
    });
  });

  // deals explorer
  var tb = $("#tb");
  if (!tb) return;
  var F = { q:$("#q"), brand:$("#f-brand"), creator:$("#f-creator"), format:$("#f-format"), stage:$("#f-stage"), from:$("#f-from"), to:$("#f-to") };
  var sortK = "date", sortDir = -1, all = [], view = [];
  var p = new URLSearchParams(location.search);
  Object.keys(F).forEach(function(k){ if (p.get(k)) F[k].value = p.get(k); });

  function fmtDate(d, approx){ if(!d) return "—"; var dt=new Date(d+"T12:00:00"); var s = dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); if(approx && d.slice(8)==="01") s = dt.toLocaleDateString("en-US",{month:"short",year:"numeric"}); return (approx?"~":"")+s; }
  function render(){
    var q = F.q.value.trim().toLowerCase(), terms = q ? q.split(/\s+/) : [];
    view = all.filter(function(d){
      if (F.brand.value && d.brand !== F.brand.value) return false;
      if (F.creator.value && d.creator !== F.creator.value) return false;
      if (F.format.value && d.format !== F.format.value) return false;
      if (F.stage.value && d.funding_stage !== F.stage.value) return false;
      if (F.from.value && d.date.slice(0,7) < F.from.value) return false;
      if (F.to.value && d.date.slice(0,7) > F.to.value) return false;
      if (terms.length){ var hay = d._h; for (var i=0;i<terms.length;i++) if (hay.indexOf(terms[i])<0) return false; }
      return true;
    });
    view.sort(function(a,b){ var x=a[sortK], y=b[sortK]; if (x==null) x = sortDir>0?Infinity:-Infinity; if (y==null) y = sortDir>0?Infinity:-Infinity; if (typeof x==="string") { x=x.toLowerCase(); y=String(y).toLowerCase(); } return (x<y?-1:x>y?1:0)*sortDir || (b.id-a.id); });
    $("#cnt").textContent = view.length + (view.length !== all.length ? " / " + all.length : "");
    var h = [];
    for (var i=0;i<view.length;i++){ var d=view[i];
      var fl = (d.unverified?'<span class="tag warn" title="Third-party tracker or uncertain">unverified</span>':"") + (d.approx?'<span class="tag" title="Approximate date">≈date</span>':"");
      var src = '<a class="src" href="'+esc(d.source_url)+'" target="_blank" rel="noopener">source↗</a>' + (d.alt_url && d.alt_url!==d.source_url ? ' <a class="src" href="'+esc(d.alt_url)+'" target="_blank" rel="noopener">video↗</a>' : "");
      h.push('<tr><td class="nowrap mono">'+fmtDate(d.date,d.approx)+'</td><td><a href="'+root+'brands/'+d.brand_slug+'.html"><b>'+esc(d.brand)+'</b></a></td><td><a href="'+root+'creators/'+d.creator_slug+'.html">'+esc(d.creator)+'</a></td><td class="dim">'+esc(d.format)+'</td><td><span class="tag '+(d.funding_stage==="Not checked"?"stg-na":"stg")+'" title="'+esc(d.funding_detail)+'">'+esc(d.funding_stage)+'</span></td><td class="ttl">'+esc(d.title)+' '+fl+'</td><td class="num mono">'+(esc(d.views_label)||"—")+'</td><td class="nowrap">'+src+'</td></tr>');
    }
    tb.innerHTML = h.join("") || '<tr><td colspan="8" class="dim">No deals match. <a href="#" id="clr" style="color:var(--acc)">Clear filters</a></td></tr>';
    var np = new URLSearchParams(); Object.keys(F).forEach(function(k){ if (F[k].value) np.set(k, F[k].value); });
    history.replaceState(null, "", location.pathname + (np.toString() ? "?" + np : ""));
  }
  function reset(){ Object.keys(F).forEach(function(k){ F[k].value=""; }); render(); }
  Object.keys(F).forEach(function(k){ F[k].addEventListener(k==="q"?"input":"change", render); });
  $("#reset").addEventListener("click", reset);
  tb.addEventListener("click", function(e){ if (e.target.id==="clr"){ e.preventDefault(); reset(); } });
  $$("#deals th[data-k]").forEach(function(th){ th.addEventListener("click", function(){
    var k = th.dataset.k; if (k===sortK) sortDir*=-1; else { sortK=k; sortDir = (k==="date"||k==="views") ? -1 : 1; }
    $$("#deals th").forEach(function(x){ x.classList.remove("sort","asc","desc"); }); th.classList.add("sort", sortDir>0?"asc":"desc"); render();
  }); });
  $("#csv").addEventListener("click", function(){
    var cols = ["date","brand","creator","format","funding_stage","title","views_label","source_url"];
    var lines = [cols.join(",")].concat(view.map(function(d){ return cols.map(function(c){ return '"'+String(d[c]==null?"":d[c]).replace(/"/g,'""')+'"'; }).join(","); }));
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"})); a.download = "sponsor-signal-deals.csv"; a.click();
  });
  fetch(root + "data/deals.json").then(function(r){ return r.json(); }).then(function(j){
    all = j.deals.map(function(d){ d._h = [d.brand,d.creator,d.format,d.title,d.funding_stage,d.funding_detail,d.evidence].join(" ").toLowerCase(); return d; });
    render();
  }).catch(function(){ tb.innerHTML = '<tr><td colspan="8">Could not load data/deals.json — serve the dist/ folder over HTTP (see README).</td></tr>'; });
})();
