SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'reference_data' ORDER BY policyname;
