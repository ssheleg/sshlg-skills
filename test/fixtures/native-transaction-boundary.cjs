'use strict';
// Routing/lock/host-selection integration tests exercise their own downstream
// effects. Their former exit-0 Claude stub cannot establish source readback.
// Mock that separate transaction boundary explicitly; native behavior is covered
// by claude_pin_transaction_test.js and the opt-in actual-CLI probe, never here.
const T=require('../../lib/claude-pin-transaction');
T.execute=()=>{
  if(process.env.SSHLG_TEST_NATIVE_CALL_LOG) require('fs').appendFileSync(process.env.SSHLG_TEST_NATIVE_CALL_LOG,'claude-pins\n');
  return {ok:true,receipt:'synthetic-native-boundary',results:[]};
};
