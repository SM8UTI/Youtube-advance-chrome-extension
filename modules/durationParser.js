const DurationParser = {
  /**
   * Parses duration string into seconds.
   * Handles formats: mm:ss, hh:mm:ss, and aria-labels.
   * Detects "LIVE" and returns a special flag.
   * @param {string} durationStr
   * @returns {number|string|null} - Returns seconds (number), "LIVE" (string), or null (missing).
   */
  parse(durationStr) {
    if (!durationStr || typeof durationStr !== 'string') return null;
    
    const cleanStr = durationStr.trim().toUpperCase();
    
    // 1. Detect LIVE videos
    if (cleanStr.includes('LIVE') || cleanStr === 'LIVE') {
      return 'LIVE';
    }

    // 2. Handle aria-labels like "10 minutes, 32 seconds"
    if (!cleanStr.includes(':') && /(?:SECOND|MINUTE|HOUR)S?/i.test(cleanStr)) {
      let totalSeconds = 0;
      const hoursMatch = cleanStr.match(/(\d+)\s*HOUR/i);
      const minutesMatch = cleanStr.match(/(\d+)\s*MINUTE/i);
      const secondsMatch = cleanStr.match(/(\d+)\s*SECOND/i);

      if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
      if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
      if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);

      return totalSeconds > 0 ? totalSeconds : null;
    }

    // 3. Handle standard formats like mm:ss or hh:mm:ss
    const timeParts = cleanStr.replace(/[^\d:]/g, '');
    if (!timeParts || !timeParts.includes(':')) return null;

    const parts = timeParts.split(':').map(str => parseInt(str.trim(), 10));
    if (parts.some(isNaN)) return null;
    
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    
    return null;
  }
};

