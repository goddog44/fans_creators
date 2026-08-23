-- ============================================================
-- 005_create_admin_functions.sql
-- SECURITY DEFINER admin RPC functions (called from the client)
-- ============================================================

-- ---------- get_caller_role helper ----------
CREATE OR REPLACE FUNCTION public.get_caller_role()
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ---------- admin_set_user_status ----------
CREATE OR REPLACE FUNCTION public.admin_set_user_status(target_user_id uuid, new_status account_status)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
  result_row profiles;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  UPDATE profiles SET status = new_status WHERE id = target_user_id RETURNING * INTO result_row;
  RETURN result_row;
END;
$$;

-- ---------- admin_set_verified ----------
CREATE OR REPLACE FUNCTION public.admin_set_verified(target_user_id uuid, is_verified boolean)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
  result_row profiles;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  UPDATE profiles SET verified = is_verified WHERE id = target_user_id RETURNING * INTO result_row;
  RETURN result_row;
END;
$$;

-- ---------- admin_set_user_role ----------
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id uuid, new_role app_role)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
  result_row profiles;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  UPDATE profiles SET role = new_role WHERE id = target_user_id RETURNING * INTO result_row;
  RETURN result_row;
END;
$$;

-- ---------- admin_assign_manager ----------
CREATE OR REPLACE FUNCTION public.admin_assign_manager(target_model_id uuid, manager_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
  result_row profiles;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  UPDATE profiles SET manager_id = manager_id WHERE id = target_model_id RETURNING * INTO result_row;
  RETURN result_row;
END;
$$;

-- ---------- admin_update_post_status ----------
CREATE OR REPLACE FUNCTION public.admin_update_post_status(target_post_id uuid, new_status content_status)
RETURNS posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
  caller_id uuid;
  post_model_id uuid;
  result_row posts;
BEGIN
  caller_id := auth.uid();
  SELECT role INTO caller_role FROM profiles WHERE id = caller_id;
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  SELECT model_id INTO post_model_id FROM posts WHERE id = target_post_id;
  IF post_model_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  IF caller_role = 'ADMIN' THEN
    -- allowed
  ELSIF caller_role = 'MANAGER' THEN
    IF NOT EXISTS (SELECT 1 FROM profiles m WHERE m.id = post_model_id AND m.manager_id = caller_id) THEN
      RAISE EXCEPTION 'Permission denied: not your model';
    END IF;
  ELSE
    RAISE EXCEPTION 'Permission denied';
  END IF;
  UPDATE posts SET status = new_status WHERE id = target_post_id RETURNING * INTO result_row;
  RETURN result_row;
END;
$$;

-- ---------- admin_update_payout_status ----------
CREATE OR REPLACE FUNCTION public.admin_update_payout_status(target_payout_id uuid, new_status payout_status)
RETURNS payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
  result_row payouts;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  UPDATE payouts SET status = new_status WHERE id = target_payout_id RETURNING * INTO result_row;
  RETURN result_row;
END;
$$;

-- ---------- admin_update_report_status ----------
CREATE OR REPLACE FUNCTION public.admin_update_report_status(target_report_id uuid, new_status report_status)
RETURNS reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
  result_row reports;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;
  UPDATE reports SET status = new_status WHERE id = target_report_id RETURNING * INTO result_row;
  RETURN result_row;
END;
$$;

-- ---------- GRANT execute to authenticated ----------
GRANT EXECUTE ON FUNCTION public.get_caller_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, account_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_verified(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_manager(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_post_status(uuid, content_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_payout_status(uuid, payout_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_report_status(uuid, report_status) TO authenticated;
