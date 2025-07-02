// Simple in-memory rate limiter for serverless functions
const userRequests = new Map();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 100;
const COOLDOWN_MS = 10 * 1000; // 10 seconds

export function checkRateLimit(ip) {
    const now = Date.now();
    const userData = userRequests.get(ip) || { 
        count: 0, 
        startTime: now, 
        lastRequestTime: 0 
    };

    // Check Cooldown
    if (now - userData.lastRequestTime < COOLDOWN_MS) {
        const timeLeft = Math.ceil((COOLDOWN_MS - (now - userData.lastRequestTime)) / 1000);
        return {
            allowed: false,
            reason: 'COOLDOWN_ACTIVE',
            messageKey: 'ERROR_COOLDOWN',
            meta: { timeLeft }
        };
    }

    // Check hourly limit window
    if (now - userData.startTime > RATE_LIMIT_WINDOW_MS) {
        // Reset window
        userData.startTime = now;
        userData.count = 0;
    }

    if (userData.count >= MAX_REQUESTS_PER_WINDOW) {
        const resetTime = new Date(userData.startTime + RATE_LIMIT_WINDOW_MS);
        return {
            allowed: false,
            reason: 'RATE_LIMIT_EXCEEDED',
            messageKey: 'ERROR_RATE_LIMIT',
            meta: { resetTime: resetTime.toLocaleTimeString('vi-VN') }
        };
    }

    // If allowed, update the user's data
    userData.count++;
    userData.lastRequestTime = now;
    userRequests.set(ip, userData);

    // Periodically clean up old entries to prevent memory leaks
    if (userRequests.size > 10000) {
        for (const [key, data] of userRequests.entries()) {
            if (now - data.startTime > RATE_LIMIT_WINDOW_MS * 2) {
                userRequests.delete(key);
            }
        }
    }

    return { allowed: true };
}

export function getRemainingRequests(ip) {
    const userData = userRequests.get(ip);
    if (!userData) return MAX_REQUESTS_PER_WINDOW;
    
    const now = Date.now();
    if (now - userData.startTime > RATE_LIMIT_WINDOW_MS) {
        return MAX_REQUESTS_PER_WINDOW;
    }
    
    return Math.max(0, MAX_REQUESTS_PER_WINDOW - userData.count);
}