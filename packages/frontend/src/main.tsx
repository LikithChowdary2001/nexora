import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getMissingFirebaseEnv } from '@/lib/env';
import { warmBackend } from '@/lib/api';
import { SetupError } from '@/components/SetupError';
import './index.css';

warmBackend();

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
