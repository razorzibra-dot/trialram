-- Guarded creation so migration doesn’t fail if complaints table is not yet present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'complaints'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE VIEW complaints_with_details AS
      SELECT
        c.id,
        c.title,
        c.description,
        c.customer_id,
        cust.company_name AS customer_name,
        cust.contact_name AS customer_contact_name,
        cust.email AS customer_email,
        c.category,
        c.priority,
        c.status,
        c.assigned_to,
        u.first_name AS assigned_first_name,
        u.last_name AS assigned_last_name,
        u.email AS assigned_email,
        c.resolution,
        c.resolved_at,
        c.tenant_id,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        COALESCE(
          json_agg(
            json_build_object(
              ''id'', cc.id,
              ''complaint_id'', cc.complaint_id,
              ''user_id'', cc.user_id,
              ''content'', cc.content,
              ''created_at'', cc.created_at,
              ''parent_id'', cc.parent_id
            )
            ORDER BY cc.created_at ASC
          ) FILTER (WHERE cc.id IS NOT NULL),
          ''[]''::json
        ) AS comments
      FROM complaints c
      LEFT JOIN customers cust ON cust.id = c.customer_id AND cust.deleted_at IS NULL
      LEFT JOIN users u ON u.id = c.assigned_to
      LEFT JOIN complaint_comments cc ON cc.complaint_id = c.id AND cc.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY
        c.id,
        c.title,
        c.description,
        c.customer_id,
        cust.company_name,
        cust.contact_name,
        cust.email,
        c.category,
        c.priority,
        c.status,
        c.assigned_to,
        u.first_name,
        u.last_name,
        u.email,
        c.resolution,
        c.resolved_at,
        c.tenant_id,
        c.created_at,
        c.updated_at,
        c.deleted_at;
    ';
  ELSE
    RAISE NOTICE 'complaints table not found; skipping complaints_with_details view creation';
  END IF;
END;
$$;
