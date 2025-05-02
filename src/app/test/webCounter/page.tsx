// components/VisitorCounter.tsx
'use client';

import { useEffect, useState } from 'react';

const VisitorCounter = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/webcount')
      .then(res => res.json())
      .then(data => setCount(data.count));
  }, []);

  return (
    <div>
      <h2>Visitor Today: {count ?? 'Loading...'}</h2>
    </div>
  );
};

export default VisitorCounter;
