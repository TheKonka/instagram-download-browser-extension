import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';

function App() {
   const [name, setName] = useState<boolean>(true);
   const [time, setTime] = useState<boolean>(true);
   const [newTab, setNewTab] = useState<boolean>(true);

   const isMobile = navigator && navigator.userAgent && /Mobi|Android|iPhone/i.test(navigator.userAgent);

   useEffect(() => {
      chrome.storage.local
         .get(['setting_include_username', 'setting_include_post_time', 'setting_show_open_in_new_tab_icon'])
         .then((res) => {
            setName(!!res.setting_include_username);
            setTime(!!res.setting_include_post_time);
            setNewTab(!!res.setting_show_open_in_new_tab_icon);
         });
   }, []);

   return (
      <>
         <div className={'container ' + (isMobile ? 'mobile' : '')}>
            <div className="settings">
               <h3 className="settings__title">icon setting</h3>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_show_icon"
                     checked={newTab}
                     onChange={() => {
                        chrome.storage.local.set({ setting_show_open_in_new_tab_icon: !newTab });
                        setNewTab((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_show_icon">Show `open in new tab` Icon</label>
               </div>
               <h3 className="settings__title">download file name setting</h3>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="setting_include_username"
                     checked={name}
                     onChange={() => {
                        chrome.storage.local.set({ setting_include_username: !name });
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
                        chrome.storage.local.set({ setting_include_post_time: !time });
                        setTime((p) => !p);
                     }}
                  />
                  <label htmlFor="setting_include_post_time">Include Post Time</label>
               </div>
            </div>
         </div>
      </>
   );
}

createRoot(document.getElementById('root')!).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>
);
