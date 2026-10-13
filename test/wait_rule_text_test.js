'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),T=require('../lib/wait-rule-text.js');
let n=0;
function check(fn){fn();n++;}
check(()=>assert.equal(T.BODY,fs.readFileSync(path.join(__dirname,'../docs/working-rules/wait-is-not-a-stop.md'),'utf8')));
for(const host of ['claude','codex','gemini','pi','cursor'])check(()=>{
 const body=T.render(host);assert(body.startsWith(T.BEGIN+'\n'));assert(body.endsWith(T.END+'\n'));
 assert.equal(body.includes('run_in_background'),host==='claude');assert.equal(body.includes('Monitor'),host==='claude');
 assert(body.includes('The rule grants no authority'));assert(body.includes('remain human'));assert(body.includes('never invent a'));assert(body.includes('session loss'));assert(body.includes('exact next task'));
});
check(()=>assert.throws(()=>T.render('continue')));
console.log(`OK (${n} checks)`);
