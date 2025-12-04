import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSession = () => {
  /**
   * Gets a fresh session, refreshing the token if needed
   * Returns null if no valid session exists
   */
  const getFreshSession = useCallback(async () => {
    try {
      // First, try to get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[useSession] Error getting session:", error);
        return null;
      }

      if (!session) {
        console.log("[useSession] No session found");
        return null;
      }

      // Check if token is about to expire (within 60 seconds)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt ? expiresAt - now : 0;

      if (timeUntilExpiry < 60) {
        console.log("[useSession] Token expiring soon, refreshing...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("[useSession] Error refreshing session:", refreshError);
          // Return the old session if refresh fails but session is still valid
          if (timeUntilExpiry > 0) {
            return session;
          }
          return null;
        }

        if (refreshData.session) {
          console.log("[useSession] Session refreshed successfully");
          return refreshData.session;
        }
      }

      return session;
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
