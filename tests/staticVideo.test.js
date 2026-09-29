import test from 'node:test';import assert from 'node:assert/strict';
import {videoRange} from '../src/lib/staticVideo.js';
test('Steam trailer byte ranges support playback, seeking and suffix requests',()=>{
  assert.deepEqual(videoRange('',100),{status:200,start:0,end:99,length:100});
  assert.deepEqual(videoRange('bytes=0-19',100),{status:206,start:0,end:19,length:20});
  assert.deepEqual(videoRange('bytes=70-',100),{status:206,start:70,end:99,length:30});
  assert.deepEqual(videoRange('bytes=-10',100),{status:206,start:90,end:99,length:10});
  assert.deepEqual(videoRange('bytes=90-200',100),{status:206,start:90,end:99,length:10});
  for(const r of ['bytes=100-','bytes=-0','bytes=40-10','bytes=-','bytes=0-1,4-5','bytes=bad','bytes=9999999999999999999999-'])assert.equal(videoRange(r,100).status,416,r);
});
