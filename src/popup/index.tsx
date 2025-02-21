import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';

import { CONFIG_LIST, DEFAULT_DATETIME_FORMAT, DEFAULT_FILENAME_FORMAT } from '../constants';

const SettingItem: React.FC<{
   value: boolean;
   setValue: React.Dispatch<React.SetStateAction<boolean>>;
   label: string;
   id: string;
}> = ({ label, value, setValue, id }) => {
   return (
      <div className="setting">
         <input
            type="checkbox"
            id={id}
            checked={value}
            onChange={() => {
               chrome.storage.sync.set({ [id]: !value });
               setValue((p) => !p);
            }}
         />
         <label htmlFor={id}>{label}</label>
      </div>
   );
};

function App() {
   const [newTab, setNewTab] = useState<boolean>(true);
   const [threads, setThreads] = useState<boolean>(true);
   const [enableVideoControl, setEnableVideoControl] = useState<boolean>(true);
   const [replaceJpegWithJpg, setReplaceJpegWithJpg] = useState<boolean>(true);
   const [useHashId, setUseHashId] = useState<boolean>(false);
   const [useIndexing, setUseIndexing] = useState<boolean>(true);

   const [fileNameFormat, setFileNameFormat] = useState<string>(DEFAULT_FILENAME_FORMAT);
   const [dateTimeFormat, setDateTimeFormat] = useState<string>(DEFAULT_DATETIME_FORMAT);

   const isMobile = navigator && navigator.userAgent && /Mobi|Android|iPhone/i.test(navigator.userAgent);

   useEffect(() => {
      chrome.storage.sync.get(CONFIG_LIST).then((res) => {
         setNewTab(!!res.setting_show_open_in_new_tab_icon);
         setThreads(!!res.setting_enable_threads);
         setEnableVideoControl(!!res.setting_enable_video_controls);
         setReplaceJpegWithJpg(!!res.setting_format_replace_jpeg_with_jpg);
         setUseHashId(!!res.setting_format_use_hash_id);
         setUseIndexing(!!res.setting_format_use_indexing);
      });

      chrome.storage.sync.get(['setting_format_filename', 'setting_format_datetime']).then((res) => {
         setFileNameFormat(res.setting_format_filename || DEFAULT_FILENAME_FORMAT);
         setDateTimeFormat(res.setting_format_datetime || DEFAULT_DATETIME_FORMAT);
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
               <h2>Icon Settings</h2>
               <SettingItem
                  value={newTab}
                  setValue={setNewTab}
                  label="Show `open in new tab` Icon"
                  id="setting_show_open_in_new_tab_icon"
               />

               <h2>Download File Name Settings</h2>
               <SettingItem
                  value={replaceJpegWithJpg}
                  setValue={setReplaceJpegWithJpg}
                  label="Replace .jpeg With .jpg"
                  id="setting_format_replace_jpeg_with_jpg"
               />
               <SettingItem
                  value={useHashId}
                  setValue={setUseHashId}
                  label="Replace Original ID With Shorter Value"
                  id="setting_format_use_hash_id"
               />

               <SettingItem
                  value={useIndexing}
                  setValue={setUseIndexing}
                  label="Append the index of the media to the end of filename"
                  id="setting_format_use_indexing"
               />

               <div className="group">
                  <input
                     type="text"
                     value={fileNameFormat}
                     onChange={(e) => {
                        setFileNameFormat(e.target.value);
                        chrome.storage.sync.set({ setting_format_filename: e.target.value || DEFAULT_FILENAME_FORMAT });
                     }}
                  />
                  <span className="highlight"></span>
                  <span className="bar"></span>
                  <label>Filename Format</label>
               </div>
               <div className="group">
                  <input
                     type="text"
                     value={dateTimeFormat}
                     onChange={(e) => {
                        setDateTimeFormat(e.target.value);
                        chrome.storage.sync.set({ setting_format_datetime: e.target.value || DEFAULT_DATETIME_FORMAT });
                     }}
                  />
                  <span className="highlight"></span>
                  <span className="bar"></span>
                  <label>Datetime Format</label>
               </div>

               <h2>Video Settings</h2>
               <SettingItem
                  value={enableVideoControl}
                  setValue={setEnableVideoControl}
                  label="Show Controls Offered By Browser"
                  id="setting_enable_video_controls"
               />

               <h2>Threads Settings</h2>
               <SettingItem value={threads} setValue={setThreads} label="Enable Threads Download" id="setting_enable_threads" />
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
