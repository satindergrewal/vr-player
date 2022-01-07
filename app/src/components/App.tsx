import { DebugPlayer } from 'components/DebugPlayer';
import { VrPlayer } from 'components/VrPlayer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useXRSession } from 'hooks/useXRSession';
import DropZone from 'react-dropzone';
import classNames from 'classnames';
import type { DropEvent, FileRejection } from 'react-dropzone';
import type { Format, Layout } from '@vr-viewer/player';

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const [layout, setLayout] = useState<Layout>('stereoLeftRight');
  const [format, setFormat] = useState<Format>('180');

  const [file, setFile] = useState<File | undefined>();
  const [ready, setReady] = useState(false);

  const [xrSupported, requestXrSession, xrSession] = useXRSession();
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    const onLoadeddata = () => {
      void (async () => {
        if (!video) return;

        // TODO: fix this...
        await video.play();
        video.pause();
        setTimeout(() => {
          setReady(true);
        }, 10);
      })();
    };

    video?.addEventListener('loadeddata', onLoadeddata);
    return () => {
      video?.removeEventListener('loadeddata', onLoadeddata);
    };
  }, [videoRef]);

  useEffect(() => {
    let objectUrl = '';
    if (file && videoRef.current) {
      objectUrl = URL.createObjectURL(file);
      videoRef.current.src = objectUrl;

      setReady(false);
    }
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, requestXrSession]);

  const onFileDrop: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);

  return (
    <DropZone
      noClick
      multiple={false}
      accept={['video/mp4', 'video/webm']}
      onDrop={onFileDrop}
    >
      {({ getRootProps, getInputProps }) => (
        <div
          className="h-full flex flex-col bg-gray-900 text-sm font-medium text-white"
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          {videoRef.current && ready && debug && (
            <DebugPlayer
              video={videoRef.current}
              canvas={canvasRef.current}
              layout={layout}
              format={format}
            />
          )}
          {videoRef.current && ready && xrSession && (
            <VrPlayer
              xrSession={xrSession}
              video={videoRef.current}
              canvas={canvasRef.current}
              layout={layout}
              format={format}
            />
          )}

          <div className="p-4 flex space-x-4">
            <div>
              <button
                type="button"
                className={classNames(
                  'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg disabled:opacity-50',
                  { 'bg-cyan-700 hover:bg-cyan-600': Boolean(xrSession) },
                )}
                aria-current={Boolean(xrSession)}
                disabled={!xrSupported}
                onClick={() => {
                  if (xrSession) {
                    void xrSession.end();
                  } else {
                    requestXrSession();
                  }
                }}
              >
                {
                  // eslint-disable-next-line no-nested-ternary
                  xrSupported
                    ? xrSession
                      ? 'Disconnect VR'
                      : 'Connect VR'
                    : 'VR not supported'
                }
              </button>
            </div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={classNames(
                  'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-l-lg',
                  { 'bg-cyan-700 hover:bg-cyan-600': layout === 'mono' },
                )}
                aria-current={layout === 'mono'}
                onClick={() => setLayout('mono')}
              >
                Mono
              </button>
              <button
                type="button"
                className={classNames(
                  'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border-t border-b border-gray-600',
                  {
                    'bg-cyan-700 hover:bg-cyan-600':
                      layout === 'stereoLeftRight',
                  },
                )}
                aria-current={layout === 'stereoLeftRight'}
                onClick={() => setLayout('stereoLeftRight')}
              >
                Left | Right
              </button>
              <button
                type="button"
                className={classNames(
                  'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-r-lg',
                  {
                    'bg-cyan-700 hover:bg-cyan-600':
                      layout === 'stereoTopBottom',
                  },
                )}
                aria-current={layout === 'stereoTopBottom'}
                onClick={() => setLayout('stereoTopBottom')}
              >
                Top | Bottom
              </button>
            </div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={classNames(
                  'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-l-lg',
                  { 'bg-cyan-700 hover:bg-cyan-600': format === 'screen' },
                )}
                aria-current={format === 'screen'}
                onClick={() => setFormat('screen')}
              >
                Screen
              </button>
              <button
                type="button"
                className={classNames(
                  'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-r-lg',
                  { 'bg-cyan-700 hover:bg-cyan-600': format === '180' },
                )}
                aria-current={format === '180'}
                onClick={() => setFormat('180')}
              >
                180°
              </button>
            </div>
            <div>
              <button
                type="button"
                className={classNames(
                  'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg',
                  { 'bg-cyan-700 hover:bg-cyan-600': debug },
                )}
                aria-current={debug}
                onClick={() => setDebug(!debug)}
              >
                Debug
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <video
              hidden={!ready}
              className={classNames('h-full mx-auto', { hidden: !ready })}
              ref={videoRef}
              muted
              controls
              loop
            />
            <div
              hidden={ready}
              className={classNames('h-full flex', { hidden: ready })}
            >
              <span className="m-auto text-xl font-medium">
                Just drag and drop a video file to play!
              </span>
            </div>
          </div>
        </div>
      )}
    </DropZone>
  );
}