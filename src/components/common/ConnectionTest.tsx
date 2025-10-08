/**
 * Connection Test Component
 * 
 * Tests Supabase connection and displays status
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ConnectionTest = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState('Checking connection...');

  const testConnection = async () => {
    setStatus('checking');
    setMessage('Testing connection to Supabase...');

    try {
      // Simple query to test connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        // Table doesn't exist yet - that's OK for now
        if (error.code === '42P01') {
          setStatus('connected');
          setMessage('✅ Connected to Supabase! (Database schema not yet created)');
        } else {
          throw error;
        }
      } else {
        setStatus('connected');
        setMessage('✅ Connected to Supabase successfully!');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Connection failed: ${error.message}`);
      console.error('Connection test error:', error);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'bg-yellow-100 text-yellow-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className={`p-4 rounded-lg mb-4 ${getStatusColor()}`}>
        <p className="font-medium">{message}</p>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p><strong>Project URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
        <p><strong>API Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
      </div>

      <Button onClick={testConnection} disabled={status === 'checking'}>
        {status === 'checking' ? 'Testing...' : 'Test Again'}
      </Button>
    </Card>
  );
};