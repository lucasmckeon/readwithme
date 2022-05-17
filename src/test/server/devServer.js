/**
 * Created by lucasmckeon on 4/21/22.
 */
import {setupWorker} from 'msw'
import {handlers} from './handlers'

const worker = setupWorker(...handlers);
worker.start({
  onUnhandledRequest:'bypass'
});