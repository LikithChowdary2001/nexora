import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getMissingFirebaseEnv } from '@/lib/env';
import { SetupError } from '@/components/SetupError';
import './index.css';

const missing = getMissingFirebaseEnv();
const root = createRoot(document.getElementById('root')!);

if (missing.length > 0) {
  root.render(<SetupError missing={missing} />);
} else {
  import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}
