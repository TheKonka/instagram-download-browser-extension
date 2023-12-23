import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';

function App() {
   const [name, setName] = useState<boolean>(true);
   const [time, setTime] = useState<boolean>(true);

   useEffect(() => {
      chrome.storage.local.get(['setting_include_username', 'setting_include_post_time']).then((res) => {
         setName(!!res.setting_include_username);
         setTime(!!res.setting_include_post_time);
      });
   }, []);

   return (
      <>
         <div className="container">
            <h2 className="title">Download File Name Setting</h2>

            <div className="settings">
               {/* <span className="settings__title field-title">file name settings</span> */}
               <div className="setting">
                  <input
                     type="checkbox"
                     id="uppercase"
                     checked={name}
                     onChange={() => {
                        chrome.storage.local.set({ setting_include_username: !name });
                        setName((p) => !p);
                     }}
                  />
                  <label htmlFor="uppercase">Include Username</label>
               </div>
               <div className="setting">
                  <input
                     type="checkbox"
                     id="lowercase"
                     checked={time}
                     onChange={() => {
                        chrome.storage.local.set({ setting_include_post_time: !time });
                        setTime((p) => !p);
                     }}
                  />
                  <label htmlFor="lowercase">Include Post Time</label>
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
