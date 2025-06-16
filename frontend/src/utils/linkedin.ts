/**
 * Extract LinkedIn profile ID from a LinkedIn URL.
 * Handles various LinkedIn URL formats:
 * - https://www.linkedin.com/in/username
 * - https://linkedin.com/in/username
 * - www.linkedin.com/in/username
 * - linkedin.com/in/username
 * 
 * @param url LinkedIn profile URL
 * @returns LinkedIn profile ID or null if extraction fails
 */
export const extractLinkedInProfileId = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    console.error("Invalid LinkedIn URL: URL is empty or not a string");
    return null;
  }

  try {
    // Debug the URL
    console.log("Attempting to extract LinkedIn profile ID from:", url);
    
    // Clean the URL first (handle cases where it might not start with http/https)
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // First try: Direct regex matching for /in/username pattern
    const inMatch = url.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
    if (inMatch && inMatch[1]) {
      const profileId = inMatch[1].split('?')[0].split('#')[0];
      console.log("Extracted profile ID (regex method):", profileId);
      return profileId;
    }
    
    // Second try: Using URL parser
    try {
      const urlObj = new URL(cleanUrl);
      if (urlObj.hostname.includes('linkedin.com')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        // Check for /in/username pattern
        if (pathParts.length >= 2 && pathParts[0].toLowerCase() === 'in') {
          const profileId = pathParts[1].split('?')[0].split('#')[0];
          console.log("Extracted profile ID (URL parser method):", profileId);
          return profileId;
        }
      }
    } catch (urlError) {
      console.error("URL parsing error:", urlError);
      // Continue to fallback method
    }
    
    // Fallback: Just get the last part of the path
    const parts = url.split('/').filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      const profileId = lastPart.split('?')[0].split('#')[0];
      console.log("Extracted profile ID (fallback method):", profileId);
      return profileId || null;
    }
    
    console.error("Could not extract profile ID from URL:", url);
    return null;
  } catch (e) {
    console.error("Error extracting LinkedIn profile ID:", e);
    return null;
  }
}; 