import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';

import { CONFIG_LIST } from '../constants';

function App() {
   const [name, setName] = useState<boolean>(true);
   const [time, setTime] = useState<boolean>(true);
   const [newTab, setNewTab] = useState<boolean>(true);
   const [threads, setThreads] = useState<boolean>(true);
   const [enableVideoControl, setEnableVideoControl] = useState<boolean>(true);

   const [fileNameFormat, setFileNameFormat] = useState<string[]>([]);

   const isMobile = navigator && navigator.userAgent && /Mobi|Android|iPhone/i.test(navigator.userAgent);

   const dragItem = useRef<number>(0);
   const dragOverItem = useRef<number>(0);
   const latestSeparator = useRef<string>('-');
   const pageX = useRef(0);
   const pageY = useRef(0);

   const handleChange = useCallback((preFormat: string[], isName: boolean, isTime: boolean) => {
      if (isName && isTime) {
         if (preFormat.length === 5) return;
         setFileNameFormat(['username', latestSeparator.current, 'datetime', latestSeparator.current, 'id']);
      } else if (isName) {
         setFileNameFormat(['username', latestSeparator.current, 'id']);
      } else if (isTime) {
         setFileNameFormat(['datetime', latestSeparator.current, 'id']);
      } else {
         setFileNameFormat(['id']);
      }
   }, []);

   useEffect(() => {
      chrome.storage.sync.get(CONFIG_LIST).then((res) => {
         setName(!!res.setting_include_username);
         setTime(!!res.setting_include_post_time);
         setNewTab(!!res.setting_show_open_in_new_tab_icon);
         setThreads(!!res.setting_enable_threads);
         setEnableVideoControl(!!res.setting_enable_video_controls);
         setFileNameFormat(res.setting_filename_format);
         latestSeparator.current = res.setting_filename_format.length > 1 ? res.setting_filename_format[1] : '-';
         handleChange(res.setting_filename_format, !!res.setting_include_username, !!res.setting_include_post_time);
      });
   }, [handleChange]);

   useEffect(() => {
      if (fileNameFormat.length > 0) {
         chrome.storage.sync.set({ setting_filename_format: fileNameFormat });
      }
   }, [fileNameFormat]);

   return (
      <>
         <main className={'container ' + (isMobile ? 'mobile' : '')}>
            <a
               className="github"
               target="_black"
               rel="noopener,noreferrer"
               href="https://github.com/TheKonka/instagram-download-browser-extension"
            >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
                  <g fillRule="evenodd" clipRule="evenodd">
                     <circle fill="#fff" cx="28" cy="28" r="28"></circle>
                     <path
                        fill="#181616"
                        d="M28 0C12.54 0 0 12.54 0 28c0 12.37 8.02 22.86 19.15 26.57 1.4.26 1.91-.61 1.91-1.35 0-.66-.02-2.43-.04-4.76-7.79 1.69-9.43-3.75-9.43-3.75-1.27-3.23-3.11-4.1-3.11-4.1-2.54-1.74.19-1.7.19-1.7 2.81.2 4.29 2.89 4.29 2.89 2.5 4.28 6.55 3.04 8.15 2.33.25-1.81.98-3.04 1.78-3.74-6.22-.71-12.75-3.11-12.75-13.84 0-3.06 1.09-5.56 2.88-7.51-.29-.71-1.25-3.56.27-7.41 0 0 2.35-.75 7.7 2.87 2.23-.62 4.63-.93 7.01-.94 2.38.01 4.77.32 7.01.94 5.35-3.62 7.69-2.87 7.69-2.87 1.53 3.85.57 6.7.28 7.41 1.79 1.96 2.88 4.46 2.88 7.51 0 10.76-6.55 13.12-12.78 13.82 1.01.86 1.9 2.57 1.9 5.19 0 3.74-.03 6.76-.03 7.68 0 .75.5 1.62 1.93 1.35C47.98 50.86 56 40.37 56 28 56 12.54 43.46 0 28 0z"
                     ></path>
                  </g>
               </svg>
            </a>
            <div className="github-bg"></div>

            <div className="settings">
               <h2>Icon Settings</h2>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_show_icon"
                     checked={newTab}
                     onChange={() => {
                        chrome.storage.sync.set({ setting_show_open_in_new_tab_icon: !newTab });
                        setNewTab((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_show_icon">Show `open in new tab` Icon</label>
               </div>

               <h2>Download File Name Settings</h2>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_include_username"
                     checked={name}
                     onChange={() => {
                        chrome.storage.sync.set({ setting_include_username: !name });
                        handleChange(fileNameFormat, !name, time);
                        setName((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_include_username">Include Username</label>
               </div>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_include_post_time"
                     checked={time}
                     onChange={() => {
                        chrome.storage.sync.set({ setting_include_post_time: !time });
                        handleChange(fileNameFormat, name, !time);
                        setTime((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_include_post_time">Include Post Time</label>
               </div>
               <div>
                  <h3>Format</h3>
                  <ul className="file-name-format">
                     {fileNameFormat.map((item, index) => {
                        if (index % 2 === 0) {
                           return isMobile ? (
                              <li
                                 id={item}
                                 key={index}
                                 draggable
                                 style={{
                                    backgroundColor: 'mediumseagreen',
                                    cursor: 'pointer',
                                 }}
                                 onTouchStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                 }}
                                 onTouchMove={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const touchLocation = e.targetTouches[0];
                                    pageX.current = Math.round(touchLocation.clientX);
                                    pageY.current = Math.round(touchLocation.clientY);
                                    const el = e.target as HTMLElement;
                                    const rect = el.getBoundingClientRect();
                                    el.style.position = 'fixed';
                                    el.style.left = pageX.current - rect.width / 2 + 'px';
                                    el.style.top = pageY.current - rect.height / 2 + 'px';
                                 }}
                                 onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    [0, 2, 4]
                                       .filter((i) => i !== index)
                                       .forEach((i) => {
                                          const rect = document.querySelector(`#${fileNameFormat[i]}`)?.getBoundingClientRect();
                                          if (
                                             rect &&
                                             rect.left <= pageX.current &&
                                             rect.top <= pageY.current &&
                                             pageX.current <= rect.right &&
                                             pageY.current <= rect.bottom
                                          ) {
                                             const newFormat = [...fileNameFormat];
                                             const temp = newFormat[index];
                                             newFormat[index] = newFormat[i];
                                             newFormat[i] = temp;
                                             setFileNameFormat(newFormat);
                                          }
                                       });
                                    (e.target as HTMLElement).style.position = 'static';
                                 }}
                              >
                                 {item}
                              </li>
                           ) : (
                              <li
                                 draggable
                                 key={index}
                                 style={{
                                    backgroundColor: 'mediumseagreen',
                                    cursor: 'pointer',
                                 }}
                                 onDragStart={() => (dragItem.current = index)}
                                 onDragEnter={() => (dragOverItem.current = index)}
                                 onDragEnd={() => {
                                    const newFormat = [...fileNameFormat];
                                    const temp = newFormat[dragItem.current];
                                    newFormat[dragItem.current] = newFormat[dragOverItem.current];
                                    newFormat[dragOverItem.current] = temp;
                                    setFileNameFormat(newFormat);
                                 }}
                              >
                                 {item}
                              </li>
                           );
                        } else {
                           return (
                              <li
                                 key={index}
                                 draggable={false}
                                 style={{
                                    backgroundColor: '#ccc',
                                 }}
                              >
                                 <input
                                    type="text"
                                    value={fileNameFormat[index]}
                                    onChange={(e) => {
                                       const newFormat = [...fileNameFormat];
                                       newFormat[index] = e.target.value;
                                       setFileNameFormat(newFormat);
                                       latestSeparator.current = e.target.value;
                                    }}
                                 />
                              </li>
                           );
                        }
                     })}
                  </ul>
               </div>

               <h2>Video Settings</h2>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_enable_video_controls"
                     checked={enableVideoControl}
                     onChange={() => {
                        chrome.storage.sync.set({ setting_enable_video_controls: !enableVideoControl });
                        setEnableVideoControl((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_enable_video_controls">Show Controls Offered By Browser</label>
               </div>

               <h2>Threads Settings</h2>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_enable_threads"
                     checked={threads}
                     onChange={() => {
                        chrome.storage.sync.set({ setting_enable_threads: !threads });
                        setThreads((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_enable_threads">Enable Threads Download</label>
               </div>
            </div>
         </main>
      </>
   );
}

createRoot(document.getElementById('root')!).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>
);
