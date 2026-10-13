#!/usr/bin/env node
'use strict';
// Refresh the published commit inventory from the staged gitlinks. Stage member
// gitlinks first; this never checks out, fetches or advances a member repository.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
if(args.length>1 || args.some(a=>!['--check','--write'].includes(a))) {
  console.error('usage: node scripts/sync-member-pins.js [--check|--write]');process.exit(2);
}
const file=path.join(root,'skills.json'), manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const r=spawnSync('git',['-C',root,'ls-files','--stage'],{encoding:'utf8'});
if(r.status!==0){console.error('cannot read staged gitlinks');process.exit(1);}
const links=new Map(r.stdout.split('\n').flatMap(l=>{const m=/^160000 ([0-9a-f]{40}) 0\t(.+)$/.exec(l);return m?[[m[2],m[1]]]:[];}));
if(args.includes('--write')) {
  for(const m of manifest.skills) {
    if(!links.has(m.dir)){console.error(`missing staged gitlink: ${m.dir}`);process.exit(1);}
    m.commit=links.get(m.dir);
  }
  require('../lib/installer-pins').verifyGitlinks(manifest.skills,r.stdout);
  fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
} else {
  try { require('../lib/installer-pins').verifyGitlinks(manifest.skills,r.stdout); }
  catch(e){console.error(e.message);process.exit(1);}
}
console.log(`${manifest.skills.length} immutable member commits match staged gitlinks`);
