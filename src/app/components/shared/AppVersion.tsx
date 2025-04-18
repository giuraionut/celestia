import React from 'react';

const AppVersion = () => {
  return (
    <span className='text-muted-foreground text-xs'>
      {process.env.version && <div>v.{process.env.version}</div>}
    </span>
  );
};

export default AppVersion;
