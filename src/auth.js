import { compare } from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';

const encoder=new TextEncoder();
export async function createSessionToken(secret,{now=Math.floor(Date.now()/1000)}={}){
  return new SignJWT({role:'admin'}).setProtectedHeader({alg:'HS256'}).setIssuedAt(now).setExpirationTime(now+8*60*60).setIssuer('disc-lap').setAudience('disc-lap-admin').sign(encoder.encode(secret));
}
export async function verifySessionToken(token,secret,{now=Math.floor(Date.now()/1000)}={}){
  const {payload}=await jwtVerify(token,encoder.encode(secret),{issuer:'disc-lap',audience:'disc-lap-admin',currentDate:new Date(now*1000)});return payload;
}
export function verifyAdminPassword(password,hash){return compare(password,hash);}
export function sessionCookie(token){return `disc_lap_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;}
export function clearSessionCookie(){return 'disc_lap_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';}
export function readCookie(request,name){const raw=request.headers.cookie||'';for(const part of raw.split(';')){const [key,...value]=part.trim().split('=');if(key===name)return value.join('=');}return null;}
