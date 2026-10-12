-- Customer profiles + atomic checkout (inventory decrement, partner attribution, COD-only)

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Storefront customer profile used for checkout autofill.';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles;
CREATE POLICY "Staff can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE lower(s.email) = lower(auth.jwt() ->> 'email')
        AND coalesce(s.is_active, true) = true
    )
  );

CREATE OR REPLACE FUNCTION public.place_checkout_orders(
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_item JSONB;
  v_product RECORD;
  v_qty INTEGER;
  v_currency TEXT;
  v_price NUMERIC;
  v_delivery NUMERIC;
  v_line JSONB;
  v_store_key TEXT;
  v_order_code TEXT;
  v_order_id UUID;
  v_orders JSONB := '[]'::jsonb;
  v_group_key TEXT;
  v_groups JSONB := '{}'::jsonb;
  v_group_items JSONB;
  v_totals JSONB;
  v_pkr_sub NUMERIC;
  v_pkr_del NUMERIC;
  v_aed_sub NUMERIC;
  v_aed_del NUMERIC;
  v_partner_store_id UUID;
  v_attempt INTEGER;
  v_ops RECORD;
  v_uae_flat NUMERIC := 15;
  v_pkr_flat NUMERIC := 200;
  v_free_aed NUMERIC := 0;
  v_free_pkr NUMERIC := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF coalesce(trim(p_customer_email), '') = '' THEN
    RAISE EXCEPTION 'Customer email is required';
  END IF;

  IF p_shipping_address IS NULL OR jsonb_typeof(p_shipping_address) <> 'object' THEN
    RAISE EXCEPTION 'Shipping address is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Hard-block card until a payment gateway is integrated.
  IF lower(coalesce(p_payment_method, '')) <> 'cod' THEN
    RAISE EXCEPTION 'Only cash on delivery is available right now';
  END IF;

  SELECT
    coalesce((payments ->> 'cod_enabled')::BOOLEAN, true) AS cod_enabled,
    coalesce((shipping ->> 'uae_flat_rate')::NUMERIC, 15) AS uae_flat_rate,
    coalesce((shipping ->> 'pakistan_flat_rate')::NUMERIC, 200) AS pakistan_flat_rate,
    coalesce((shipping ->> 'free_shipping_threshold_aed')::NUMERIC, 0) AS free_aed,
    coalesce((shipping ->> 'free_shipping_threshold_pkr')::NUMERIC, 0) AS free_pkr
  INTO v_ops
  FROM public.platform_ops_settings
  WHERE singleton_key = 'primary';

  IF FOUND THEN
    IF v_ops.cod_enabled IS NOT TRUE THEN
      RAISE EXCEPTION 'Cash on delivery is currently disabled';
    END IF;
    v_uae_flat := v_ops.uae_flat_rate;
    v_pkr_flat := v_ops.pakistan_flat_rate;
    v_free_aed := v_ops.free_aed;
    v_free_pkr := v_ops.free_pkr;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, address, city, country, postal_code, updated_at)
  VALUES (
    v_uid,
    nullif(trim(p_shipping_address ->> 'full_name'), ''),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    nullif(trim(p_shipping_address ->> 'address'), ''),
    nullif(trim(p_shipping_address ->> 'city'), ''),
    nullif(trim(p_shipping_address ->> 'country'), ''),
    nullif(trim(p_shipping_address ->> 'postal_code'), ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    address = COALESCE(EXCLUDED.address, public.profiles.address),
    city = COALESCE(EXCLUDED.city, public.profiles.city),
    country = COALESCE(EXCLUDED.country, public.profiles.country),
    postal_code = COALESCE(EXCLUDED.postal_code, public.profiles.postal_code),
    updated_at = NOW();

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(1, coalesce((v_item ->> 'quantity')::INTEGER, 0));
    IF v_qty < 1 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT
      p.id,
      p.name,
      p.price,
      p.price_pkr,
      p.price_aed,
      p.delivery_charge,
      p.location,
      p.inventory,
      p.is_active,
      p.partner_store_id
    INTO v_product
    FROM public.products p
    WHERE p.id = (v_item ->> 'product_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found';
    END IF;

    IF coalesce(v_product.is_active, false) IS NOT TRUE THEN
      RAISE EXCEPTION '% is no longer available', v_product.name;
    END IF;

    IF coalesce(v_product.inventory, 0) < v_qty THEN
      RAISE EXCEPTION '% only has % in stock', v_product.name, coalesce(v_product.inventory, 0);
    END IF;

    UPDATE public.products
    SET inventory = inventory - v_qty,
        updated_at = NOW()
    WHERE id = v_product.id;

    v_currency := upper(coalesce(v_item ->> 'currency', 'AED'));
    IF v_currency = 'PKR' THEN
      v_price := coalesce(v_product.price_pkr, v_product.price, 0);
    ELSE
      v_currency := 'AED';
      v_price := coalesce(v_product.price_aed, v_product.price, 0);
    END IF;

    v_delivery := coalesce(v_product.delivery_charge, 0);

    v_line := jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'price', v_price,
      'quantity', v_qty,
      'currency', v_currency,
      'delivery_charge', v_delivery,
      'location', coalesce(v_product.location, 'UAE'),
      'partner_store_id', v_product.partner_store_id
    );

    v_store_key := coalesce(v_product.partner_store_id::TEXT, 'platform');
    v_group_items := coalesce(v_groups -> v_store_key, '[]'::jsonb) || jsonb_build_array(v_line);
    v_groups := jsonb_set(v_groups, ARRAY[v_store_key], v_group_items, true);
  END LOOP;

  FOR v_group_key, v_group_items IN SELECT * FROM jsonb_each(v_groups)
  LOOP
    v_pkr_sub := 0;
    v_pkr_del := 0;
    v_aed_sub := 0;
    v_aed_del := 0;

    FOR v_line IN SELECT * FROM jsonb_array_elements(v_group_items)
    LOOP
      IF (v_line ->> 'currency') = 'PKR' THEN
        v_pkr_sub := v_pkr_sub + ((v_line ->> 'price')::NUMERIC * (v_line ->> 'quantity')::INTEGER);
        v_pkr_del := v_pkr_del + ((v_line ->> 'delivery_charge')::NUMERIC * (v_line ->> 'quantity')::INTEGER);
      ELSE
        v_aed_sub := v_aed_sub + ((v_line ->> 'price')::NUMERIC * (v_line ->> 'quantity')::INTEGER);
        v_aed_del := v_aed_del + ((v_line ->> 'delivery_charge')::NUMERIC * (v_line ->> 'quantity')::INTEGER);
      END IF;
    END LOOP;

    -- Platform flat rate when no per-product delivery was set; then free-shipping thresholds.
    IF v_pkr_sub > 0 AND v_pkr_del = 0 THEN
      v_pkr_del := v_pkr_flat;
    END IF;
    IF v_aed_sub > 0 AND v_aed_del = 0 THEN
      v_aed_del := v_uae_flat;
    END IF;
    IF v_free_pkr > 0 AND v_pkr_sub >= v_free_pkr THEN
      v_pkr_del := 0;
    END IF;
    IF v_free_aed > 0 AND v_aed_sub >= v_free_aed THEN
      v_aed_del := 0;
    END IF;

    v_totals := jsonb_build_object(
      'pkr', jsonb_build_object(
        'subtotal', v_pkr_sub,
        'delivery', v_pkr_del,
        'total', v_pkr_sub + v_pkr_del
      ),
      'aed', jsonb_build_object(
        'subtotal', v_aed_sub,
        'delivery', v_aed_del,
        'total', v_aed_sub + v_aed_del
      )
    );

    IF v_group_key = 'platform' THEN
      v_partner_store_id := NULL;
    ELSE
      v_partner_store_id := v_group_key::UUID;
    END IF;

    v_order_code := NULL;
    FOR v_attempt IN 1..12 LOOP
      v_order_code := 'CC' || (1000 + floor(random() * 9000))::INTEGER::TEXT;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.order_code = v_order_code);
      v_order_code := NULL;
    END LOOP;

    IF v_order_code IS NULL THEN
      RAISE EXCEPTION 'Could not allocate order code';
    END IF;

    INSERT INTO public.orders (
      order_code,
      user_id,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      totals,
      payment_method,
      status,
      partner_store_id
    ) VALUES (
      v_order_code,
      v_uid,
      lower(trim(p_customer_email)),
      nullif(trim(coalesce(p_customer_phone, '')), ''),
      p_shipping_address,
      v_group_items,
      v_totals,
      'cod',
      'Order Received',
      v_partner_store_id
    )
    RETURNING id INTO v_order_id;

    INSERT INTO public.order_status_history (order_id, status, notes, created_by)
    VALUES (v_order_id, 'Order Received', 'Order placed via checkout', v_uid);

    v_orders := v_orders || jsonb_build_array(jsonb_build_object(
      'id', v_order_id,
      'order_code', v_order_code,
      'partner_store_id', v_partner_store_id
    ));
  END LOOP;

  RETURN jsonb_build_object('orders', v_orders);
END;
$$;

REVOKE ALL ON FUNCTION public.place_checkout_orders(TEXT, TEXT, JSONB, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_checkout_orders(TEXT, TEXT, JSONB, TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.place_checkout_orders IS
  'Places COD checkout orders, decrements inventory under row locks, and attributes partner_store_id per seller.';
