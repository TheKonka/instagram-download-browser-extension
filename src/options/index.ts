import './index.scss';

const PERMISSIONS = {
   origins: ['https://www.instagram.com/*'],
};
const PERMS_DECLINED_MESSAGE = 'Permission request was declined.\nPlease try again.';

const permissionRequestButtons = document.getElementsByClassName('permissions-request');

for (const elem of permissionRequestButtons) {
   elem.addEventListener('click', permissionsRequest);
}

async function permissionsRequest(event: any) {
   event.stopPropagation();
   const result = await browser.permissions.request(PERMISSIONS);

   if (result) {
      document.body.classList.add('permissions-granted');
   } else {
      window.alert(PERMS_DECLINED_MESSAGE);
   }
}

async function setupSettingsUI() {
   const hasPermissions = await browser.permissions.contains(PERMISSIONS);

   if (hasPermissions) {
      document.body.classList.add('permissions-granted');
   } else {
      document.body.classList.remove('permissions-granted');
   }
}

setupSettingsUI();
