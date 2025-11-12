import { onMounted, onUnmounted } from 'vue';

interface DevtoolsDetectorConfig {
  pollingIntervalSeconds: number;
  maxMillisBeforeAckWhenClosed: number;
  moreAnnoyingDebuggerStatements: number;
  onDetectOpen?: () => void;
  onDetectClose?: () => void;
  startup: 'manual' | 'asap' | 'domContentLoaded';
  onCheckOpennessWhilePaused: 'throw' | 'returnStaleValue';
}

interface DevtoolsDetector {
  config: DevtoolsDetectorConfig;
  isOpen: boolean;
  paused: boolean;
}

export function useDisableDevTools() {
  const config: DevtoolsDetectorConfig = {
    pollingIntervalSeconds: 0.25,
    maxMillisBeforeAckWhenClosed: 100,
    moreAnnoyingDebuggerStatements: 1,
    onDetectOpen: undefined,
    onDetectClose: undefined,
    startup: 'asap',
    onCheckOpennessWhilePaused: 'returnStaleValue',
  };
  Object.seal(config);

  let detector: DevtoolsDetector | null = null;

  onMounted(() => {
    if (import.meta.dev) return;

    const heart = new Worker(
      URL.createObjectURL(
        new Blob(
          [
            ``,
            `"use strict";
            onmessage = (ev) => { postMessage({isOpenBeat:true});
            debugger; for (let i = 0; i < ev.data.moreDebugs; i++) { debugger; }
            postMessage({isOpenBeat:false});
            };`,
          ],
          { type: 'text/javascript' }
        )
      )
    );

    let _isDevtoolsOpen = false;
    let _isDetectorPaused = true;

    let resolveVerdict: ((value: boolean | null) => void) | undefined;
    let nextPulse$: number | undefined;

    const onHeartMsg = (
      msg: MessageEvent<{ isOpenBeat: boolean }>
    ) => {
      if (msg.data.isOpenBeat) {
        const p = new Promise<boolean | null>((_resolveVerdict) => {
          resolveVerdict = _resolveVerdict;
          const wait$ = setTimeout(() => {
            resolveVerdict(true);
          }, config.maxMillisBeforeAckWhenClosed + 1);
        });
        p.then((verdict) => {
          if (verdict === null) return;
          if (verdict !== _isDevtoolsOpen) {
            _isDevtoolsOpen = verdict;
            const cb = verdict
              ? config.onDetectOpen
              : config.onDetectClose;
            if (cb) cb();
          }
          nextPulse$ = window.setTimeout(() => {
            nextPulse$ = undefined;
            doOnePulse();
          }, config.pollingIntervalSeconds * 1000);
        });
      } else {
        resolveVerdict?.(false);
      }
    };

    const doOnePulse = () => {
      heart.postMessage({
        moreDebugs: config.moreAnnoyingDebuggerStatements,
      });
    };

    detector = {
      config,
      get isOpen() {
        if (
          _isDetectorPaused &&
          config.onCheckOpennessWhilePaused === 'throw'
        ) {
          throw new Error(
            '`onCheckOpennessWhilePaused` is set to `"throw"`.'
          );
        }
        return _isDevtoolsOpen;
      },
      get paused() {
        return _isDetectorPaused;
      },
      set paused(pause: boolean) {
        if (_isDetectorPaused === pause) {
          return;
        }
        _isDetectorPaused = pause;
        if (pause) {
          heart.removeEventListener('message', onHeartMsg);
          if (nextPulse$) clearTimeout(nextPulse$);
          nextPulse$ = undefined;
          resolveVerdict?.(null);
        } else {
          heart.addEventListener('message', onHeartMsg);
          doOnePulse();
        }
      },
    };

    if (config.startup === 'asap') {
      detector.paused = false;
    } else if (config.startup === 'domContentLoaded') {
      if (document.readyState !== 'loading') {
        detector.paused = false;
      } else {
        document.addEventListener(
          'DOMContentLoaded',
          () => {
            detector!.paused = false;
          },
          { once: true }
        );
      }
    }
  });

  onUnmounted(() => {
    if (detector) {
      detector.paused = true;
      detector = null;
    }
  });

  return {
    config,
    getDetector: () => detector,
  };
}
