"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { streamerOption, type StreamerOption } from "@/lib/result-models";
import { useApiPage } from "./use-api-page";
import type { SearchMode } from "../types";
/** Search creators on the server; selection uses stable platform-qualified identities. */
export function useStreamerOptions({ effectiveStreamer, searchMode, queryParam, replaceParams }: {
 effectiveStreamer: string | null; searchMode: SearchMode; queryParam: string;
 replaceParams: (values: Record<string,string|null|undefined>) => void; routePathStreamer: string | null;
}) {
 const [openStreamerPopover,setOpenStreamerPopover]=useState(false);
 const [pickerQuery,setPickerQuery]=useState("");
 const [debouncedQuery,setDebouncedQuery]=useState("");
 useEffect(()=>{const timer=setTimeout(()=>setDebouncedQuery(pickerQuery),250);return()=>clearTimeout(timer);},[pickerQuery]);
 const [selected,setSelected]=useState<StreamerOption|null>(null);
 const [resolveError,setResolveError]=useState<string|null>(null);
 const [resolving,setResolving]=useState(false);
 const [revision,setRevision]=useState(0);
 const result=useApiPage("/creators", {q: searchMode === "streamers" ? queryParam : debouncedQuery}, openStreamerPopover || searchMode === "streamers");
 useEffect(()=>{
   const controller=new AbortController(); setResolveError(null); setSelected(null);
   if(!effectiveStreamer) {setResolving(false);return;}
   setResolving(true);
   const resolve=async()=>{
    try {
     const account=effectiveStreamer.includes(":")
       ? (await apiGet("/creators",{creatorId:effectiveStreamer},controller.signal)).items[0]
       : await apiGet("/creators/resolve",{source:"twitch",name:effectiveStreamer},controller.signal);
     if(!account) throw new Error("Creator not found");
     if(!controller.signal.aborted)setSelected(streamerOption(account));
    }catch(error){if(!controller.signal.aborted)setResolveError(error instanceof Error?error.message:"Could not load creator");}
    finally{if(!controller.signal.aborted)setResolving(false);}
   }; void resolve(); return()=>controller.abort();
 },[effectiveStreamer,revision]);
 const options=result.items.map(streamerOption);
 return {streamerOptions:options,filteredStreamers:options,
   resolvedStreamer:selected?{id:selected.streamer_id,displayName:selected.streamer_display_name,avatar:selected.streamer_avatar}:null,
   openStreamerPopover,setOpenStreamerPopover,pickerQuery,setPickerQuery,
   loading:result.loading||resolving, error:resolveError??result.error, hasMore:result.hasMore,loadMore:result.loadMore,
   filterReady:!effectiveStreamer||!!selected,
   retry:()=>{setRevision(v=>v+1);result.retry();},
   handleSelectStreamer:(option:StreamerOption|null)=>{replaceParams({streamer:option?.streamer_id??null});setOpenStreamerPopover(false);}};
}
