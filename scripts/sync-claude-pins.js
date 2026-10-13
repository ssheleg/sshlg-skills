#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const C=require('../lib/claude-plugin-source');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);
let write=false,sourceRoot=root;
for(let i=0;i<args.length;i++) {
  if(args[i]==='--write') write=true;
  else if(args[i]==='--check') {}
  else if(args[i]==='--source-root' && args[i+1]) sourceRoot=path.resolve(args[++i]);
  else {console.error('usage: sync-claude-pins.js [--check|--write] [--source-root PATH]');process.exit(2);}
}
try {
 const members=require('../skills.json').skills;
 const staged=spawnSync('git',['-C',root,'ls-files','--stage'],{encoding:'utf8'});
 if(staged.status!==0) throw Error('cannot read staged gitlinks');
 require('../lib/installer-pins').verifyGitlinks(members,staged.stdout);
 const data=C.generate(members,sourceRoot),file=path.join(root,'claude-plugin-pins.json');
 C.validate(data,members);
 if(write) fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
 else if(JSON.stringify(JSON.parse(fs.readFileSync(file,'utf8')))!==JSON.stringify(data)) throw Error('Claude plugin pin inventory differs from exact member trees; regenerate with --write');
 console.log(data.members.length+' Claude plugin pins match staged member trees');
} catch(e) {console.error(e.message);process.exit(1);}
