import { useAuth } from '@/contexts/AuthContext';

/**
 * Debug component to display current session info in the browser
 * Add this to any page to see your actual tenant_id
 */
export const SessionDebugger = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#1a1a1a',
      color: '#00ff00',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ff6b6b' }}>
        🔍 SESSION DEBUG
      </div>
      <div><strong>Email:</strong> {user.email}</div>
      <div><strong>Name:</strong> {user.name}</div>
      <div><strong>Role:</strong> {user.role}</div>
      <div style={{ marginTop: '6px', color: '#ffd93d' }}>
        <strong>Tenant ID:</strong>
        <div style={{ fontSize: '9px', wordBreak: 'break-all', marginTop: '2px' }}>
          {user.tenantId || 'NULL - THIS IS THE PROBLEM!'}
        </div>
      </div>
      {!user.tenantId && (
        <div style={{ marginTop: '8px', color: '#ff6b6b', fontSize: '10px' }}>
          ⚠️ NO TENANT_ID! This is why dropdowns are empty.
        </div>
      )}
    </div>
  );
};
