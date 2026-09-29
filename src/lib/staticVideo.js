import {createReadStream} from 'node:fs';
export function videoRange(header,size){
  if(!Number.isSafeInteger(size)||size<=0)return {status:416};
  if(!header)return {status:200,start:0,end:size-1,length:size};
  const m=String(header).match(/^bytes=(\d*)-(\d*)$/);if(!m||!m[1]&&!m[2])return {status:416};
  let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));
  let end=m[1]&&m[2]?Math.min(size-1,Number(m[2])):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start<0||end<start||!m[1]&&Number(m[2])===0)return {status:416};
  return {status:206,start,end,length:end-start+1};
}
export async function serveStaticVideo(response,file,size,{method='GET',range=''}={}){
  const r=videoRange(range,size);const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Cache-Control':'public, max-age=31536000, immutable'};
  if(r.status===416){response.writeHead(416,{...headers,'Content-Range':'bytes */'+size});response.end();return;}
  headers['Content-Length']=r.length;if(r.status===206)headers['Content-Range']=`bytes ${r.start}-${r.end}/${size}`;
  response.writeHead(r.status,headers);if(method==='HEAD'){response.end();return;}
  await new Promise(resolve=>{const stream=createReadStream(file,{start:r.start,end:r.end});const done=()=>{stream.destroy();resolve();};response.once('close',done);response.once('finish',done);stream.once('error',()=>{response.destroy();done();});stream.pipe(response);});
}
