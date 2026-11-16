// Runs before every test file (vite.config.ts test.setupFiles).
import { configure } from '@testing-library/react';

import { WAIT_TIMEOUT_MS } from './timeouts';

configure({ asyncUtilTimeout: WAIT_TIMEOUT_MS });
