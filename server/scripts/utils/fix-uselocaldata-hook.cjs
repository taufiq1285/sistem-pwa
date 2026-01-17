const fs = require('fs');
const path = require('path');

const hookFile = path.join(__dirname, 'src/lib/hooks/useLocalData.ts');

// Read the file
let content = fs.readFileSync(hookFile, 'utf8');

// Fix the infinite loop issue by making the autoLoad effect run only on mount
content = content.replace(
  `  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);`,
  `  useEffect(() => {
    if (autoLoad) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);`
);

// Fix the refresh interval effect too
content = content.replace(
  `  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        load();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, load]);`,
  `  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        load();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval]);`
);

// Write the file back
fs.writeFileSync(hookFile, content, 'utf8');

console.log('Fixed useLocalData hook - removed infinite loop issue');
