/**
 * Aula Personal · servicio de sincronización separado del Worker de IA.
 * Requiere binding D1 DB y secreto SYNC_ACCESS_TOKEN.
 * Almacena únicamente payloads cifrados por el navegador; el servidor no recibe claves de cifrado.
 * NO desplegar sin configurar los secretos y revisar el dominio permitido.
 */
const ORIGIN='https://basconjoel-droid.github.io';
const MAX_BYTES=200000;
const HEADERS={'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS})}
export default {
 async fetch(req,env){
  if(req.headers.get('Origin')!==ORIGIN)return json({error:'Origen no autorizado'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...HEADERS,'Access-Control-Allow-Methods':'GET,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,If-Match'}});
  if(!env.DB||!env.SYNC_ACCESS_TOKEN)return json({error:'Servicio sin configurar'},503);
  const auth=req.headers.get('Authorization')||'';
  if(auth!=='Bearer '+env.SYNC_ACCESS_TOKEN)return json({error:'No autorizado'},401);
  const url=new URL(req.url);
  if(url.pathname!=='/sync/v1/object')return json({error:'Ruta desconocida'},404);
  const key=url.searchParams.get('key')||'';
  if(!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(key))return json({error:'Clave no válida'},400);
  const owner='personal';
  if(req.method==='GET'){
   const row=await env.DB.prepare('SELECT payload,revision,updated_at FROM sync_objects WHERE owner_id=? AND object_key=?').bind(owner,key).first();
   return row?json(row):json({error:'No encontrado'},404);
  }
  if(req.method!=='PUT')return json({error:'Método no permitido'},405);
  const raw=await req.text();
  if(raw.length>MAX_BYTES)return json({error:'Objeto demasiado grande'},413);
  let body;try{body=JSON.parse(raw)}catch{return json({error:'JSON inválido'},400)}
  if(typeof body?.payload!=='string'||body.payload.length>MAX_BYTES||!body.payload.startsWith('apenc1:'))return json({error:'Se requiere contenido cifrado'},400);
  const expected=Number(req.headers.get('If-Match'));
  if(!Number.isSafeInteger(expected)||expected<0)return json({error:'Revisión obligatoria'},428);
  const now=Date.now();
  if(expected===0){
   const result=await env.DB.prepare('INSERT OR IGNORE INTO sync_objects(owner_id,object_key,revision,payload,updated_at) VALUES(?,?,1,?,?)').bind(owner,key,body.payload,now).run();
   if(!result.meta.changes)return json({error:'Conflicto: objeto existente'},409);
   return json({revision:1,updated_at:now});
  }
  const result=await env.DB.prepare('UPDATE sync_objects SET payload=?,revision=revision+1,updated_at=? WHERE owner_id=? AND object_key=? AND revision=?').bind(body.payload,now,owner,key,expected).run();
  if(!result.meta.changes)return json({error:'Conflicto: revisión desactualizada'},409);
  return json({revision:expected+1,updated_at:now});
 }
};
