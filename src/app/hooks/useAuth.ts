"use client";

import { getSessionUserId } from "@/actions/actionUtils";
import { useEffect, useState } from "react";

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAuthStatus() {
            try {
                const userId = await getSessionUserId();
                setIsLoggedIn(!!userId);
            } catch (error) {
                console.error("Failed to check auth status:", error);
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        }

        checkAuthStatus();
    }, []);

    return { isLoggedIn, isLoading };
}