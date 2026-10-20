"use client";
import { useEffect, useState } from "react";
import { cachedGet } from "@/lib/api-cache";
import { streamerOption, type StreamerOption } from "@/lib/result-models";
import type { Streamer } from "@/lib/api-contract";
import { useApiPage } from "./use-api-page";
import type { SearchMode } from "../types";
/** Search Streamers on the server; selection uses the numeric Streamer id. */
export function useStreamerOptions({ effectiveStreamer, searchMode, queryParam, replaceParams }: {
 effectiveStreamer: string | null; searchMode: SearchMode; queryParam: string;
 replaceParams: (values: Record<string,string|null|undefined>) => void; routePathStreamer: string | null;
}) {
 const [openStreamerPopover,setOpenStreamerPopover]=useState(false);
 const [pickerQuery,setPickerQuery]=useState("");
 const [debouncedQuery,setDebouncedQuery]=useState("");
 useEffect(()=>{const timer=setTimeout(()=>setDebouncedQuery(pickerQuery),250);return()=>clearTimeout(timer);},[pickerQuery]);
 const [resolved,setResolved]=useState<{key:string;selected:StreamerOption|null;streamer:Streamer|null;error:string|null}|null>(null);
 const [revision,setRevision]=useState(0);
 const result=useApiPage("/streamers", {q: searchMode === "streamers" ? queryParam : debouncedQuery}, openStreamerPopover || searchMode === "streamers");
 const resolveKey=`${effectiveStreamer}|${revision}`;
 const settled=resolved?.key===resolveKey?resolved:null;
 const selected=settled?.selected??null;
 const resolveError=settled?.error??null;
 const resolving=!!effectiveStreamer&&!settled;
 useEffect(()=>{
   if(!effectiveStreamer) return;
   const controller=new AbortController();
   const resolve=async()=>{
    try {
     const id=Number(effectiveStreamer.replace(/^twitch:/,""));
     if(!Number.isSafeInteger(id)||id<1) throw new Error("Streamer not found");
     const account=await cachedGet(`/streamers/${id}`,{},{signal:controller.signal});
     if(!controller.signal.aborted)setResolved({key:resolveKey,selected:streamerOption(account),streamer:account,error:null});
    }catch(error){if(!controller.signal.aborted)setResolved({key:resolveKey,selected:null,streamer:null,error:error instanceof Error?error.message:"Could not load streamer"});}
   }; void resolve(); return()=>controller.abort();
 },[effectiveStreamer,resolveKey]);
 const options=result.items.map(streamerOption);
 return {streamer:settled?.streamer??null,streamerOptions:options,filteredStreamers:options,
   resolvedStreamer:selected?{id:selected.streamer_id,displayName:selected.streamer_display_name,avatar:selected.streamer_avatar}:null,
   openStreamerPopover,setOpenStreamerPopover,pickerQuery,setPickerQuery,
   loading:result.loading||resolving, error:resolveError??result.error, hasMore:result.hasMore,loadMore:result.loadMore,
   filterReady:!effectiveStreamer||!!selected,
   retry:()=>{setRevision(v=>v+1);result.retry();},
   handleSelectStreamer:(option:StreamerOption|null)=>{replaceParams({streamer:option?.streamer_id??null});setOpenStreamerPopover(false);}};
}
