// src/lib/hooks/useLoginHistory.ts
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/useAuth';
import { LoginHistoryItem } from '@/lib/auth/types';

// Key สำหรับ React Query
const LOGIN_HISTORY_QUERY_KEY = 'loginHistory';

interface LoginHistoryOptions {
  // จำนวนรายการต่อหน้า (default: 10)
  limit?: number;
  // โหมดการดูข้อมูล (default: 'grouped')
  viewMode?: 'grouped' | 'all';
  // ดึงข้อมูลอัตโนมัติเมื่อ hook นี้ถูกเรียกใช้ (default: true)
  autoFetch?: boolean;
}

/**
 * Custom hook สำหรับจัดการประวัติการเข้าสู่ระบบ
 */
export function useLoginHistory(options: LoginHistoryOptions = {}) {
  const { 
    limit = 10, 
    viewMode: initialViewMode = 'grouped',
    autoFetch = true
  } = options;
  
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // สถานะภายใน
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>(initialViewMode);
  
  // สถานะการแบ่งหน้า
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    pages: 1
  });
  
  // Reset หน้าเมื่อเปลี่ยนโหมดการดู
  useEffect(() => {
    setPage(1);
  }, [viewMode]);
  
  // ฟังก์ชันดึงประวัติการเข้าสู่ระบบ
  const fetchLoginHistory = useCallback(async ({ page = 1, viewMode = 'grouped' }) => {
    if (!isAuthenticated || !user?.id) {
      return { history: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
    
    const groupByIp = viewMode === 'grouped';
    const response = await fetch(
      `/api/user/login-history?page=${page}&limit=${limit}&groupByIp=${groupByIp}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching login history: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch login history');
    }
    
    return {
      history: viewMode === 'grouped' ? data.groupedHistory : data.history,
      pagination: data.pagination,
      currentIp: data.currentIp
    };
  }, [isAuthenticated, user, limit]);
  
  // ใช้ React Query สำหรับดึงข้อมูล
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [LOGIN_HISTORY_QUERY_KEY, user?.id, page, viewMode],
    queryFn: () => fetchLoginHistory({ page, viewMode }),
    enabled: autoFetch && isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 นาที
    gcTime: 10 * 60 * 1000, // 10 นาที
    onSuccess: (data) => {
      setPagination(data.pagination);
    }
  });
  
  // Mutation สำหรับออกจากระบบ IP อื่น
  const logoutSessionMutation = useMutation({
    mutationFn: async ({ ipAddress, sessionId }: { ipAddress: string, sessionId?: string }) => {
      const response = await fetch('/api/user/logout-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip_address: ipAddress,
          session_id: sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error logging out IP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to logout IP');
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate และดึงข้อมูลใหม่หลังจากออกจากระบบสำเร็จ
      queryClient.invalidateQueries({ queryKey: [LOGIN_HISTORY_QUERY_KEY] });
      refetch();
    }
  });
  
  // ฟังก์ชันออกจากระบบ IP อื่น
  const logoutSession = useCallback((ipAddress: string, sessionId?: string) => {
    return logoutSessionMutation.mutate({ ipAddress, sessionId });
  }, [logoutSessionMutation]);
  
  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  // ฟังก์ชันเปลี่ยนโหมดการดู
  const changeViewMode = useCallback((mode: 'grouped' | 'all') => {
    setViewMode(mode);
    setPage(1); // Reset หน้าเมื่อเปลี่ยนโหมด
  }, []);
  
  return {
    // ข้อมูล
    history: data?.history || [],
    currentIp: data?.currentIp,
    
    // สถานะ
    isLoading,
    isError,
    error,
    viewMode,
    
    // การแบ่งหน้า
    pagination,
    page,
    
    // Actions
    refetch,
    logoutSession,
    handlePageChange,
    changeViewMode,
    
    // สถานะ mutation
    isLoggingOut: logoutSessionMutation.isPending,
    logoutError: logoutSessionMutation.error
  };
}