import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSession = () => {
  /**
   * Gets a fresh session, always attempting to validate/refresh with the server
   * Returns null if no valid session exists
   */
  const getFreshSession = useCallback(async () => {
    try {
      // Always try to refresh the session to ensure it's valid on the server
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("[useSession] Error refreshing session:", refreshError);
        
        // If refresh fails, the session is invalid - sign out to clear stale data
        if (refreshError.message?.includes('session_not_found') || 
            refreshError.message?.includes('invalid') ||
            refreshError.status === 403) {
          console.log("[useSession] Session invalid, signing out...");
          await supabase.auth.signOut();
        }
        
        return null;
      }

      if (refreshData.session) {
        console.log("[useSession] Session validated/refreshed successfully");
        return refreshData.session;
      }

      return null;
    } catch (error) {
      console.error("[useSession] Unexpected error:", error);
      return null;
    }
  }, []);

  /**
   * Invoke a Supabase function with automatic token refresh
   */
  const invokeFunction = useCallback(async <T = any>(
    functionName: string,
    options?: { body?: any }
  ): Promise<{ data: T | null; error: Error | null }> => {
    const session = await getFreshSession();

    if (!session) {
      return {
        data: null,
        error: new Error("No valid session available")
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        ...options,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        // If we get a 401, the session became invalid - clear it
        if (error.message?.includes('401') || error.message?.includes('authenticated')) {
          await supabase.auth.signOut();
        }
        return { data: null, error };
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error("Unknown error") 
      };
    }
  }, [getFreshSession]);

  return {
    getFreshSession,
    invokeFunction
  };
};
