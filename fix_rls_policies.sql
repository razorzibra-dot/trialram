-- Drop old policies that use JWT claim
DROP POLICY IF EXISTS reference_data_select_policy ON reference_data;
DROP POLICY IF EXISTS reference_data_insert_policy ON reference_data;
DROP POLICY IF EXISTS reference_data_update_policy ON reference_data;
DROP POLICY IF EXISTS reference_data_delete_policy ON reference_data;

-- Policy 2: Regular users see only their tenant's reference data (SELECT)
CREATE POLICY reference_data_select_policy ON reference_data
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Policy 3: Regular users can insert their tenant's reference data
CREATE POLICY reference_data_insert_policy ON reference_data
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Policy 4: Regular users can update their tenant's reference data
CREATE POLICY reference_data_update_policy ON reference_data
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Policy 5: Regular users can delete their tenant's reference data
CREATE POLICY reference_data_delete_policy ON reference_data
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );
