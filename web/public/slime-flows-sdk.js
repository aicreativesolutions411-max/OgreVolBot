/** First-party session SDK. No API keys, private keys or automatic activation.
 * Supply getToken() from your trusted SlimeWire sign-in integration, never URLs.
 * Call capabilities before presenting activation. Unsupported actions fail closed.
 */
export function createSlimeFlowsClient({baseUrl='',getToken,fetchImpl=globalThis.fetch}={}){
  const base=new URL(baseUrl||globalThis.location?.origin||'https://app.slimewire.org');
  if(!['https:','http:'].includes(base.protocol)||base.username||base.password||base.search||base.hash)throw Error('Use a trusted API origin without credentials, query or fragment.');
  if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('HTTPS is required.');
  const request=async(path,body)=>{
    const token=path==='capabilities'?'':await getToken?.();if(path!=='capabilities'&&!token)throw Error('An authenticated SlimeWire session is required.');
    const response=await fetchImpl(new URL('/api/web/flows/'+path,base),{method:body?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(path==='readiness'?60000:15000)});
    const result=await response.json();if(!response.ok||result.ok!==true)throw Error(result.message||result.error||'SlimeWire program request failed.');return body?result.result:result;
  };
  return Object.freeze({capabilities:()=>request('capabilities'),dashboard:()=>request('dashboard'),checkReadiness:body=>request('readiness',body),saveDraft:body=>request('draft',body),simulate:body=>request('preview',body),review:body=>request('review',body),activate:body=>request('activate',body),pause:body=>request('pause',body)});
}
