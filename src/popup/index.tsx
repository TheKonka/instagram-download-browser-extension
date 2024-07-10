import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';

function App() {
   const [name, setName] = useState<boolean>(true);
   const [time, setTime] = useState<boolean>(true);
   const [newTab, setNewTab] = useState<boolean>(true);
   const [threads, setThreads] = useState<boolean>(true);

   const isMobile = navigator && navigator.userAgent && /Mobi|Android|iPhone/i.test(navigator.userAgent);

   useEffect(() => {
      chrome.storage.sync
         .get(['setting_include_username', 'setting_include_post_time', 'setting_show_open_in_new_tab_icon', 'setting_enable_threads'])
         .then((res) => {
            setName(!!res.setting_include_username);
            setTime(!!res.setting_include_post_time);
            setNewTab(!!res.setting_show_open_in_new_tab_icon);
            setThreads(!!res.setting_enable_threads);
         });
   }, []);

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
               <h3>Icon Setting</h3>
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
               <h3>Download File Name Setting</h3>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_include_username"
                     checked={name}
                     onChange={() => {
                        chrome.storage.sync.set({ setting_include_username: !name });
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
                        setTime((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_include_post_time">Include Post Time</label>
               </div>

               <h3>Threads Setting</h3>
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
