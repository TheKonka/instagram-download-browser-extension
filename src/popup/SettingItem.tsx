const SettingItem: React.FC<{
   value: boolean;
   setValue: React.Dispatch<React.SetStateAction<boolean>>;
   label: string;
   id: string;
   onChange?: () => void;
}> = ({ label, value, setValue, id, onChange }) => {
   return (
      <div className="setting">
         <input
            type="checkbox"
            id={id}
            checked={value}
            onChange={() => {
               chrome.storage.sync.set({ [id]: !value });
               setValue((p) => !p);
               if (onChange) onChange();
            }}
         />
         <label htmlFor={id}>{label}</label>
      </div>
   );
};

export default SettingItem;
