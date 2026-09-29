-- M12: prevent anonymous/public RPC execution
revoke execute on function public.create_agency_workspace(text,text,text) from public;
revoke execute on function public.respond_agency_contact_request(uuid,text) from public;
revoke execute on function public.review_agency_player_request(uuid,text,text) from public;
