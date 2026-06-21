CREATE OR REPLACE FUNCTION public.log_product_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_user_id uuid := auth.uid();
  actor_name text;
  actor_email text;
BEGIN
  IF actor_user_id IS NOT NULL THEN
    SELECT s.full_name, s.email
    INTO actor_name, actor_email
    FROM public.staff s
    WHERE s.user_id = actor_user_id
    LIMIT 1;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'products', OLD.id, 'DELETE', to_jsonb(OLD),
      actor_user_id, actor_name, actor_email
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'products', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
      actor_user_id, actor_name, actor_email
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'products', NEW.id, 'CREATE', to_jsonb(NEW),
      actor_user_id, actor_name, actor_email
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_staff_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_user_id uuid := auth.uid();
  actor_name text;
  actor_email text;
BEGIN
  IF actor_user_id IS NOT NULL THEN
    SELECT s.full_name, s.email
    INTO actor_name, actor_email
    FROM public.staff s
    WHERE s.user_id = actor_user_id
    LIMIT 1;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'staff', OLD.id, 'DELETE', to_jsonb(OLD),
      actor_user_id, actor_name, actor_email
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'staff', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
      actor_user_id, actor_name, actor_email
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'staff', NEW.id, 'CREATE', to_jsonb(NEW),
      actor_user_id, actor_name, actor_email
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;
