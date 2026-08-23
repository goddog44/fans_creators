-- 006_fix_advisor_warnings.sql
-- Revoke EXECUTE from PUBLIC on SECURITY DEFINER functions

REVOKE EXECUTE ON FUNCTION public.admin_set_user_status(uuid, account_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_verified(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_assign_manager(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_post_status(uuid, content_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_payout_status(uuid, payout_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_report_status(uuid, report_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_caller_role() FROM PUBLIC;
